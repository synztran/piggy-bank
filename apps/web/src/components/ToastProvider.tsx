"use client";

import { GooeyToaster } from "goey-toast";
import "goey-toast/styles.css";
import "./toast.css";

export default function ToastProvider() {
  return (
    <GooeyToaster
      position="top-center"
      theme="dark"
      bounce={0.2}
      offset="80px"
      gap={10}
    />
  );
}
