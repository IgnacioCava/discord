"use client";

import { FormEvent, useEffect, useState } from "react";
import { User } from "@prisma/client";
import { createUser, deleteUser, updateUser } from "../actions/userActions";

const UserPage = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch("/api/user")
      .then((res) => res.json())
      .then(setUsers);
  }, []);
  //console.log(users);

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const newUser = await createUser({ name, email });

    if (newUser) {
      setUsers((prevUsers) => [...prevUsers, newUser]); // Add new user to the state
    }
  };

  const handleUpdateUser = async (
    event: FormEvent<HTMLFormElement>,
    user: User
  ) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newName = formData.get("updatename") as string;

    if (newName.trim()) {
      const updatedUser = await updateUser({
        ...user,
        name: newName,
      });
      const updatedUserState = users.map((u) =>
        u.id === user.id ? updatedUser : u
      );
      setUsers(updatedUserState);
    }
  };

  const handleDeleteUser = async (user: User) => {
    const deletedUser = await deleteUser(user);
    if (deletedUser) {
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.id !== deletedUser.id)
      );
    }
  };
  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} ({user.email})
            <button onClick={() => handleDeleteUser(user)}>delete</button>
            <form onSubmit={(event) => handleUpdateUser(event, user)}>
              <input placeholder={user.name} name="updatename" />
              <button type="submit">update</button>
            </form>
          </li>
        ))}
      </ul>
      <form onSubmit={handleCreateUser}>
        <input placeholder="name" name="name" />
        <input placeholder="email" name="email" />
        <button type="submit">create</button>
      </form>
    </div>
  );
};

export default UserPage;
