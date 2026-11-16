CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_email_lowercase" CHECK (email = lower(email))
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

INSERT INTO "users" ("id", "email", "password")
VALUES ('0', 'pikachu@pokemart.com', 'pikapika!123');
