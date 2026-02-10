import React from "react";

type Props = {
  index: number;
  text: string;
};

const keys = [
  { 1: "➀" },
  { 2: "➁" },
  { 3: "➂" },
  { 4: "➃" },
  { 5: "➄" },
  { 6: "➅" },
  { 7: "➆" },
  { 8: "➇" },
  { 9: "➈" },
];

function Cookie(props: Props): React.ReactElement {
  return (
    <span className="uppercase text-[18px] font-vremena tracking-tight">
      {keys.find((k) => Object.keys(k)[0] === String(props.index))?.[
        props.index as keyof (typeof keys)[0]
      ] || props.index}{" "}
      <span className="text-[16px]">{props.text}</span>
    </span>
  );
}

export { Cookie };
