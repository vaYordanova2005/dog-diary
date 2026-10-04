-- CreateTable
CREATE TABLE "AttachmentFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dogId" TEXT NOT NULL,

    CONSTRAINT "AttachmentFolder_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "folderId" TEXT;

-- AddForeignKey
ALTER TABLE "AttachmentFolder" ADD CONSTRAINT "AttachmentFolder_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "AttachmentFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
