import { Handle, HandleProps } from "reactflow";

export default function CustomHandle(props: HandleProps) {
  return (
    <Handle
      style={{
        width: 15,
        height: 15,
        background: "white",
        border: "2px solid black",
      }}
      {...props}
    />
  );
}
