"use server";

import { prisma } from "../../lib/prisma";
import { hashSync, genSaltSync, compareSync } from "bcryptjs";

const create = async (formData: FormData) => {
  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");

  const salt = genSaltSync(10);
  const hashedPassword = hashSync(password as string, salt);

  const user = await prisma.user.create({
    data: {
      name: name as string,
      email: email as string,
      password: hashedPassword,
    },
  });

  return user;
};

const login = async (formData: FormData) => {
  const email = formData.get("email");
  const password = formData.get("password");

  const user = await prisma.user.findUnique({
    where: { email: email as string },
  });

  if (!user) {
    return { error: "Invalid password or email" };
  }

  const isPasswordValid = compareSync(password as string, user.password);

  if (!isPasswordValid) {
    return { error: "Invalid password or email" };
  }

  return user;
};

const profile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return user;
};

const update = async (formData: FormData) => {
  const userId = formData.get("userId");
  const name = formData.get("name");
  const email = formData.get("email");
  const avatar = formData.get("avatar");

  const user = await prisma.user.update({
    where: { id: userId as string },
    data: {
      name: name as string,
      email: email as string,
      avatar: avatar as string,
    },
  });

  return user;
};

const deleteUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user?.isAdmin) {
    return { error: "Unauthorized" };
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  return;
};

export { create, login, profile, update, deleteUser };
