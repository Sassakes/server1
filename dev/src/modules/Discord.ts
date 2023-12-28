import { Client, GatewayIntentBits, TextChannel, WebhookClient, Message, FetchMessagesOptions } from "discord.js";
import { channelId, discordToken, webhookUrl } from "../util/env";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

async function fetchAllMessages(channel: TextChannel): Promise<Message[]> {
    let lastId: string | undefined;
    const allMessages: Message[] = [];
    do {
        const options: FetchMessagesOptions = { limit: 100 };
        if (lastId) options.before = lastId;

        const messages = await channel.messages.fetch(options) as unknown as Iterable<Message>;
        allMessages.push(...Array.from(messages));
        lastId = messages[messages.length - 1]?.id;
    } while (lastId);

    return allMessages;
}

async function sendMessagesToWebhook(messages: Message[]): Promise<void> {
    const webhookClient = new WebhookClient({ url: webhookUrl });
    for (const msg of messages) {
        await webhookClient.send({
            content: msg.content,
            username: msg.author.username,
            avatarURL: msg.author.displayAvatarURL(),
        }).catch((error: Error) => console.error("Error sending message:", error));
    }
}

client.on("ready", async () => {
    console.log(`Logged in as ${client.user?.tag}!`);
    const channel = client.channels.cache.get(channelId) as TextChannel;

    try {
        const messages = await fetchAllMessages(channel);
        await sendMessagesToWebhook(messages);
        console.log("All previous messages sent to webhook.");
    } catch (error) {
        console.error("An error occurred:", error);
    } finally {
        client.destroy();
    }
});

client.login(discordToken);
