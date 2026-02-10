import { NextRequest, NextResponse } from "next/server";

const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN;
const accessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Create a customer in Shopify with the email
    const mutation = `
      mutation customerCreate($input: CustomerCreateInput!) {
        customerCreate(input: $input) {
          customer {
            id
            email
          }
          customerUserErrors {
            code
            field
            message
          }
        }
      }
    `;

    const response = await fetch(
      `https://${shopifyDomain}/api/2024-01/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": accessToken!,
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            input: {
              email: email,
              acceptsMarketing: true,
            },
          },
        }),
      }
    );

    const data = await response.json();

    if (data.errors || data.data.customerCreate.customerUserErrors.length > 0) {
      const errors = data.errors || data.data.customerCreate.customerUserErrors;
      console.error("Shopify API error:", errors);
      
      // Check if customer already exists
      if (errors[0]?.message?.includes("taken")) {
        return NextResponse.json(
          { message: "Email already subscribed" },
          { status: 200 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to subscribe" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Successfully subscribed", customer: data.data.customerCreate.customer },
      { status: 200 }
    );
  } catch (error) {
    console.error("Newsletter API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
  return emailRegex.test(email) && email.length <= 254 && email.length >= 6;
}