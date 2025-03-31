"use client";

import { useSession, signIn, signOut } from "next-auth/react";

const Auth = () => {
  const { data: session, status } = useSession();
  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return (
      <div>
        <button onClick={() => signIn('google')}>Sign in</button>
      </div>
    );
  }

  return (
    <div>
      {/* <h1>Welcome, {session.user.name}</h1> */}
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  );
};

export default Auth;
