"use client"
import React from "react";
import dynamic from 'next/dynamic';
const StoreProviderComponentWithNoSSR = dynamic(
  () => import('../redux/storeProvider'),
  { ssr: false }
)

export default function Home() {
  return (
    <StoreProviderComponentWithNoSSR />
  );
}
