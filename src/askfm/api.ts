import { AxiosRequestConfig } from "axios";
import axios from "axios";
import { generateSignature } from "../askfm/generate_hash";

type Message = {
    fullName?: string;
    accountId?: string;
    avatarUrl?: string;
    createdAt: number;
    text: string;
    isOwn: boolean;
};

type Answer = {
    type: string;
    body: string;
    createdAt: number;
};

type RootAnswer = {
    avatarThumbUrl?: string;
    author?: string;
    authorName?: string;
    createdAt: number;
};

type Owner = {
    owner: string;
    avatarUrl: string;
    fullName: string;
};
export type ThreadDetails = {
    loggedInUser: string;
    threadId: string;
    owner: Owner;
    root: RootAnswer;
    answer: Answer;
    messages: Message[];
};

const getUnixTime = (): number => {
    return Math.floor(new Date().getTime() / 1000);
};

// GetThreads
// API: GET answers/chats
// Params: ?limit=25&qid= 174009108712 &rt=17&ts=1700937407
export const getThreadsDetails = async (
    questionId: string
): Promise<ThreadDetails> => {
    const hashMap: Map<string, string | number> = new Map();
    const time = getUnixTime();

    hashMap.set("limit", 25);
    hashMap.set("qid", questionId);
    hashMap.set("ts", time);
    hashMap.set("rt", 1);

    const endpoint = "/answers/chats";
    const signature = generateSignature(endpoint, "GET", hashMap);

    let config: AxiosRequestConfig = {
        method: "get",
        maxBodyLength: Infinity,
        url: `https://api.ask.fm/answers/chats?limit=25&rt=1&ts=${time}&qid=${questionId}`,
        headers: {
            "X-Api-Version": "1.18",
            "X-Client-Type": "android_4.91.1",
            "X-Access-Token": import.meta.env.VITE_X_ACCESS_TOKEN,
            Authorization: `HMAC ${signature}`
        }
    };
    const resp = await axios.request(config);
    const data = resp.data;

    const messages: Message[] = data?.messages || [];

    const threadDetails: ThreadDetails = {
        loggedInUser: resp.headers.login,
        threadId: data?.root?.qid,
        owner: {
            owner: data?.owner?.uid,
            avatarUrl: data?.owner?.avatarUrl,
            fullName: data?.owner?.fullName
        },
        root: {
            author: data?.root?.author,
            authorName: data?.root?.authorName,
            avatarThumbUrl: data?.root?.avatarThumbUrl,
            createdAt: data?.root?.createdAt
        },
        answer: {
            type: data?.root?.answer?.type,
            body: data?.root?.answer?.body,
            createdAt: data?.root?.answer?.createdAt
        },
        messages: messages.map((message: any) => ({
            fullName: message.fullName,
            accountId: message.uid,
            avatarUrl: message.avatarUrl,
            createdAt: message.createdAt,
            text: message.text,
            isOwn: message.isOwn // TODO: fix this one it's always false as it ref to the owner of the question (the one who sent)
        }))
    };

    return threadDetails;
};

// AddToThread
// API: POST /chats/messages
// Body: json=%7B%22anonymous%22%3A%22false%22%2C%22qid%22%3A%22174009108712%22%2C%22rt%22%3A%22253%22%2C%22text%22%3A%22dddd%22%2C%22ts%22%3A%221700945087%22%7D&
export async function addToThread(
    questionId: string,
    text: string,
    isAnon: boolean
) {
    const time = getUnixTime();
    const hashMap: Map<string, string | boolean> = new Map();

    hashMap.set("ts", time.toString());
    hashMap.set("rt", "1");
    hashMap.set("qid", questionId);
    hashMap.set("anonymous", isAnon);
    hashMap.set("text", text);

    const sortedEntries = [...hashMap.entries()].sort((a, b) =>
        a[0].localeCompare(b[0])
    );
    const jsonData: Record<string, string | boolean> = Object.fromEntries(
        sortedEntries
    );

    const endpoint = "/chats/messages";
    const signature = generateSignature(endpoint, "POST", hashMap);

    let config: AxiosRequestConfig = {
        method: "post",
        url: `https://api.ask.fm/chats/messages`,
        headers: {
            "X-Api-Version": "1.18",
            "X-Client-Type": "android_4.91.1",
            "X-Access-Token": import.meta.env.VITE_X_ACCESS_TOKEN,
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Authorization: `HMAC ${signature}`
        },
        data: { json: JSON.stringify(jsonData) }
    };

    const d = await axios.request(config);
}
