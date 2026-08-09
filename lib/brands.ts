/**
 * House metadata for the shop's in-page brand header (.bnote), keyed by the
 * exact Shopify vendor name. The `note` is a FALLBACK only: at runtime the shop
 * prefers the live Shopify collection description (editable in Shopify admin),
 * and uses this copy when Shopify has none. `est` and `city` drive the header's
 * "Est. YYYY / City / N pieces / From $X" line. Descriptions are original,
 * researched from multiple sources, with no fabricated facts; est/city are
 * included only where corroborated by two or more credible sources.
 */
export type BrandInfo = {
  est?: string;
  city?: string;
  note?: string;
};

export const BRANDS: Record<string, BrandInfo> = {
  "Post Archive Faction (PAF)": {
    est: "2018",
    city: "Seoul, South Korea",
    note: `Post Archive Faction (PAF) is a Seoul based label founded in 2018 by Dongjoon Lim and Sookyo Jeong. Drawing on backgrounds in industrial and spatial design, the duo build deconstructed, futuristic menswear defined by deep archival research and a concept driven approach. PAF organizes its collections into distinct lines that range from wearable to highly experimental.`,
  },
  Kozaburo: {
    est: "2017",
    city: "New York, United States",
    note: `Kozaburo is a New York based menswear label founded in 2017 by Japanese designer Kozaburo Akasaka. Trained at Central Saint Martins and Parsons and shaped by a stint at Thom Browne, Akasaka fuses Japanese craft traditions such as sakiori weaving and sashiko stitching with Western tailoring. The label earned a special prize at the LVMH Prize in 2017.`,
  },
  AVAVAV: {
    city: "Florence, Italy",
    note: `AVAVAV is an experimental fashion house based in Florence, Italy, led by creative director Beate Karlsson. Known for irreverent, theatrical runway concepts that blur fashion and performance, the independent label channels humour and provocation while working extensively with deadstock materials. Its viral shows have made it a fixture of contemporary avant-garde conversation.`,
  },
  "11 by Boris Bidjan Saberi": {
    est: "2013",
    city: "Barcelona, Spain",
    note: `11 by Boris Bidjan Saberi is the diffusion line of Barcelona based, German designer Boris Bidjan Saberi, launched in 2013 and named for his fascination with numerology and his date of birth. It translates the main line's avant-garde sensibility into a more wearable register, pairing skate and streetwear influences with technical fabrics and everyday staples.`,
  },
  Xlim: {
    est: "2021",
    city: "Seoul, South Korea",
    note: `Xlim, stylized XLIM, is a Seoul based avant-garde label founded in 2021 by Dohee Kim, the stylist known for shaping the look of Korean R&B artist DEAN. Operating as a multidisciplinary collective, XLIM releases its collections as cinematic "Episodes" rather than seasons, applying film inspired narrative to washed, sport tinged tailoring. The result is a distinctly Korean take on elevated streetwear built on continuous reinvention.`,
  },
  Aenrmous: {
    est: "2021",
    city: "Hong Kong",
    note: `Aenrmous, stylized aenrmous, is a Hong Kong label founded in 2021 that keeps its designers deliberately anonymous. Working in an artisanal, conceptual register, it treats detail as equally important as material and tailoring. Detachable modular elements, structural pleats, asymmetric drapes, and layered silhouettes translate avant-garde runway ideas into functional everyday form.`,
  },
  Aesynctx: {
    est: "2022",
    city: "Seoul, South Korea",
    note: `Aesynctx, stylized AESYNCTX, is a Seoul based avant-garde label founded in 2022 by designer Heewon Park. The brand reworks obsolete design codes through an experimental, future facing lens, pairing utilitarian construction with cyber inspired detail. Washed, distressed finishes and transformable, function driven pieces define its dystopian nostalgic aesthetic.`,
  },
  Veerkracht: {
    note: `Veerkracht is an independent, unisex streetwear label whose name is the Dutch word for resilience. It is known for utilitarian, modular design, including its signature zip and velcro biker pants, and is carried by avant-garde stockists across Asia.`,
  },
  Notinlist: {
    est: "2020",
    city: "Kuala Lumpur, Malaysia",
    note: `Notinlist, stylized NOTINLIST, is a conceptual techwear label based in Kuala Lumpur, Malaysia, founded in 2020 by designer Xavier OU, who works under the alias XV-O. Blending fashion with science fiction storytelling, the brand structures its output as "Levels," beginning with the LV.0 line, rather than conventional seasons. Its garments draw on video game interfaces, mecha anime, and futuristic lore through technical, function driven construction.`,
  },
  SF1OG: {
    est: "2019",
    city: "Berlin, Germany",
    note: `SF1OG is a Berlin based fashion label founded in 2019 by designer Rosa Marga Dahl, who runs it with business partner Jacob Langemeyer. Its name stands for Seitenflugel 1. Obergeschoss, the side wing first floor flat where Dahl began sewing. Known for genderless, story driven design, SF1OG builds emotive, craft focused garments from deadstock and vintage materials, a hallmark of its sustainable approach.`,
  },
  Undercover: {
    est: "1990",
    city: "Tokyo, Japan",
    note: `Undercover is the Japanese label founded in Tokyo in 1990 by designer Jun Takahashi. Rooted in punk and youth subculture, the brand pairs subversive graphics and dark romanticism with meticulous Japanese construction. An early favorite of Rei Kawakubo, Undercover has grown into one of the most influential voices in avant-garde fashion.`,
  },
  Kapital: {
    est: "1985",
    city: "Kojima, Japan",
    note: `Kapital is the Japanese label founded in 1985 by Toshikiyo Hirata in Kojima, Okayama, the district known as Japan's denim capital. Now guided by his son Kiro Hirata, the brand is celebrated for its indigo dyed denim and heritage textile techniques such as boro patchwork and sashiko stitching. Every piece reflects a deep obsession with craft and wear.`,
  },
  "Hysteric Glamour": {
    est: "1984",
    city: "Tokyo, Japan",
    note: `Hysteric Glamour is the Japanese label founded in Tokyo in 1984 by Nobuhiko Kitamura. Drawing on Western counterculture, punk music, and vintage Americana, the brand became a defining name in Harajuku streetwear. Its provocative graphics and rock and roll attitude have earned a devoted cult following that spans generations.`,
  },
  TheSoloist: {
    est: "2010",
    city: "Tokyo, Japan",
    note: `TAKAHIROMIYASHITA TheSoloist is the Tokyo based label founded in 2010 by Japanese designer Takahiro Miyashita, previously the mind behind Number (N)ine. The name reflects Miyashita's belief that everyone who touches clothing should carry a solitary, individual spirit. The brand is known for its poetic, avant-garde approach to menswear and precise craftsmanship.`,
  },
  "Chrome Hearts": {
    est: "1988",
    city: "Los Angeles, USA",
    note: `Chrome Hearts is the American luxury label founded in Los Angeles in 1988 by Richard Stark. Born from custom leather gear made for motorcycle riders, the brand evolved into a cult name in high end sterling silver jewelry, leather, and apparel. Its gothic crosses, daggers, and fleur de lis motifs remain instantly recognizable hallmarks.`,
  },
  "Rick Owens": {
    est: "1994",
    city: "Paris, France",
    note: `Rick Owens is the cult American label founded in 1994 by its namesake designer, born in Porterville, California, and now headquartered in Paris, France. Known for a dark, sculptural aesthetic, the house has built a signature language of draped jersey, sculpted leather, and elongated silhouettes that reads as gothic glamour. It remains rare among luxury houses in staying fully independent.`,
  },
  "Saint Laurent": {
    est: "1961",
    city: "Paris, France",
    note: `Saint Laurent is the storied French fashion house founded in 1961 in Paris by designer Yves Saint Laurent and Pierre Berge. A pioneer of modern ready to wear, the house is celebrated for its sharp tailoring and for popularizing "Le Smoking," the tuxedo suit for women. Its rock and roll elegance remains a benchmark of Parisian luxury.`,
  },
  "Helmut Lang": {
    est: "1986",
    city: "New York, United States",
    note: `Helmut Lang is the influential fashion label founded in 1986 by the Austrian designer of the same name and now headquartered in New York. A defining voice of 1990s minimalism, the brand is known for its clean lines, pared back palettes, precise tailoring, and pioneering use of technical fabrics.`,
  },
  "Dries Van Noten": {
    est: "1986",
    city: "Antwerp, Belgium",
    note: `Dries Van Noten is the Belgian fashion house founded in 1986 by its namesake designer, one of the influential Antwerp Six who emerged from the city's Royal Academy of Fine Arts. Based in Antwerp, the label is renowned for its exuberant prints, rich textiles, and masterful mixing of colors, patterns, and fabrics sourced from around the world.`,
  },
  "Ann Demeulemeester": {
    est: "1985",
    city: "Antwerp, Belgium",
    note: `Ann Demeulemeester is the Antwerp based fashion house founded in 1985 by the Belgian designer of the same name, one of the celebrated Antwerp Six. Rooted in a black and white palette, the label is known for its dark romanticism, fluid tailoring, and poetic, androgynous silhouettes.`,
  },
  "Raf Simons": {
    est: "1995",
    city: "Antwerp, Belgium",
    note: `Raf Simons is the Belgian label founded in 1995 by the pioneering menswear designer of the same name, born in Neerpelt, Belgium. Known for reshaping modern menswear with lean silhouettes and references to youth culture, music, and art, the brand pairs an anti fashion spirit with an intellectual, subcultural sensibility.`,
  },
};
