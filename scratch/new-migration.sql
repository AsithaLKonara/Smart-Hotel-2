-- AlterTable
ALTER TABLE "RoomMapping" ADD COLUMN     "channelConfigId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "RoomMapping_channelConfigId_otaRoomTypeId_key" ON "RoomMapping"("channelConfigId", "otaRoomTypeId");

-- AddForeignKey
ALTER TABLE "RoomMapping" ADD CONSTRAINT "RoomMapping_channelConfigId_fkey" FOREIGN KEY ("channelConfigId") REFERENCES "ChannelConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

