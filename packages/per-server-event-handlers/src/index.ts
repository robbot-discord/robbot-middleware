import { PerServerEventHandlers } from "./types"
import { EventHandlers } from "@robbot/robbot-core/dist/handlers"
import { produce } from "immer"
import { EventHandlerMiddleware } from "@robbot/robbot-core/dist/middleware/types"

export const createServerFilterMiddleware = (
  configuration: PerServerEventHandlers
): EventHandlerMiddleware => {
  return (eventHandlers: EventHandlers) => {
    return produce(eventHandlers, (draft) => {
      draft.message = (message) => {
        if (message.guild) {
          const guildSnowflake = message.guild.id
          const guildMessageHandler = configuration[guildSnowflake]?.message

          if (guildMessageHandler) {
            guildMessageHandler(message)
          } else {
            eventHandlers.message(message)
          }
        }
      }
    })
  }
}

export * from "./types"
