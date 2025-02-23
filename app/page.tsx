"use client";

import { signOut } from "next-auth/react";

export default function Home() {
  return (
    <div>
      <h1>
        Hello World <br />
        <button onClick={() => signOut()}>deslogar</button>
      </h1>
    </div>
  );
}
