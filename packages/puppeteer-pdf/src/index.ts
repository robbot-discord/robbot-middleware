import axios from "axios"
import { TextChannel } from "discord.js"
import puppeteer from "puppeteer"
import { Message } from "discord.js"
import { Logger, EventHandlerMiddleware } from "@robbot/robbot-core/dist"
import { EventHandlers } from "@robbot/robbot-core/dist/handlers"
import { Stream } from "stream"

export const getLinksInString = (str: string): URL[] => {
  const linkRegex = /(https?:\/\/[\S]+)/gi
  const linkMatches = str.match(linkRegex)

  const linkUrls: URL[] = []
  if (linkMatches) {
    for (const linkMatch of linkMatches) {
      try {
        const linkUrl = new URL(linkMatch)
        linkUrls.push(linkUrl)
      } catch (e) {
        // no-op
      }
    }
  }

  return linkUrls
}

export const createPuppeteerPdfMiddleware = (
  logger: Logger,
  puppeteerCreator?: () => Promise<puppeteer.Browser>
): EventHandlerMiddleware => {
  return (eventHandlers: EventHandlers) => {
    return {
      ...eventHandlers,
      message: async (message: Message) => {
        const messageChannel = message.channel
        const linkUrls = getLinksInString(message.content)
        const browser = await (puppeteerCreator
          ? puppeteerCreator()
          : puppeteer.launch({
              executablePath: "/usr/bin/chromium-browser",
            }))

        if (
          linkUrls.length === 0 ||
          messageChannel === undefined ||
          !(messageChannel instanceof TextChannel)
        ) {
          return
        }

        const messageTextChannel = messageChannel

        try {
          for (const url of linkUrls) {
            const response = await axios.get<Stream>(url.href, {
              responseType: "stream",
            })

            if (response.status === 200) {
              const pathEnding = url.pathname.split("/").slice(-1)[0]
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              const contentType = response.headers["content-type"] as string
              if (
                contentType.includes("text/html") &&
                (url.origin.includes("4cdn") || url.origin.includes("4chan"))
              ) {
                const page = await browser.newPage()
                try {
                  await page.goto(url.href, {
                    waitUntil: "networkidle2",
                  })
                  await page.emulateMediaType("screen")
                  const pdfBuffer = await page.pdf({ format: "Letter" })

                  await messageTextChannel.send(undefined, {
                    embed: undefined,
                    files: [
                      { attachment: pdfBuffer, name: `${pathEnding}.pdf` },
                    ],
                  })
                } finally {
                  page.close()
                }
              }
            }
          }
        } finally {
          await browser.close()
        }

        return eventHandlers.message(message)
      },
    }
  }
}

export * from "./types"
