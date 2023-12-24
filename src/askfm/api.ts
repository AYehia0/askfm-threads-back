import { AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";
import { generateSignature } from "../askfm/generate_hash";

type Message = {
    id: number;
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
    photoThumbUrl?: string;
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

const buildUrl = (hashMap: Map<string, string | number>): string => {
    const entries = [...hashMap.entries()].sort((a, b) =>
        a[0].localeCompare(b[0])
    );
    let url = "";
    entries.forEach(entry => {
        url += `${entry[0]}=${entry[1]}&`;
    });
    // remove the last &
    return url.slice(0, -1);
};

const getThreadFromTime = async (
    questionId: string,
    fromTime: number
): Promise<AxiosResponse> => {
    const hashMap: Map<string, string | number> = new Map();
    const time = getUnixTime();

    hashMap.set("limit", 25);
    hashMap.set("qid", questionId);
    hashMap.set("ts", time);
    hashMap.set("rt", 1);
    hashMap.set("from", fromTime);

    // make the url from the hashMap but sort the keys first
    const url = buildUrl(hashMap);

    const endpoint = "/answers/chats";
    const signature = generateSignature(endpoint, "GET", hashMap);

    let config: AxiosRequestConfig = {
        method: "get",
        maxBodyLength: Infinity,
        url: `https://api.ask.fm/answers/chats?${url}`,
        headers: {
            "X-Api-Version": "1.18",
            "X-Client-Type": "android_4.91.1",
            "X-Access-Token": import.meta.env.VITE_X_ACCESS_TOKEN,
            Authorization: `HMAC ${signature}`
        }
    };
    return await axios.request(config);
};

// GetThreads
// API: GET answers/chats
// Params: ?limit=25&qid= 174009108712 &rt=17&ts=1700937407
// FEAT: Get all the qustions under the thread using from=timestamp
export const getThreadDetails = async (
    questionId: string,
    questionNums: string
): Promise<ThreadDetails> => {
    let fromTime = getUnixTime();
    let threadDetails = {} as ThreadDetails;

    // get all the questions under the thread
    // one request can only get 25 questionsq so we need to send multiple requests based on the questionNums
    // so if there exist 50 questions, we need to send 2 requests, any number less than 25 will only send 1 request

    const nums = Math.ceil(Number(questionNums) / 25);
    for (let i = 0; i < nums; i++) {
        let resp = await getThreadFromTime(questionId, fromTime);
        const data = resp.data;
        const messages: Message[] = data?.messages || [];

        if (Object.keys(threadDetails).length === 0) {
            threadDetails = {
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
                    createdAt: data?.root?.answer?.createdAt,
                    photoThumbUrl: data?.root?.answer?.photoThumbUrl
                },
                messages: messages.map((message: any) => ({
                    id: message.id,
                    fullName: message.fullName,
                    // make accountId is resp.headers.login if isoown is true else message.uid
                    accountId: message.isOwn ? resp.headers.login : message.uid,
                    avatarUrl: message.avatarUrl,
                    createdAt: message.createdAt,
                    text: message.text,
                    isOwn: message.isOwn
                }))
            };
        } else {
            threadDetails.messages = threadDetails.messages.concat(
                messages.map((message: any) => ({
                    id: message.id,
                    fullName: message.fullName,
                    accountId: message.uid,
                    avatarUrl: message.avatarUrl,
                    createdAt: message.createdAt,
                    text: message.text,
                    isOwn: message.isOwn
                }))
            );
        }

        // last time of the last messages
        fromTime =
            threadDetails.messages[threadDetails.messages.length - 1]
                .createdAt - 1;
    }

    // sort the messages by createdAt in threadDetails.messages
    threadDetails.messages.sort((a, b) => a.createdAt - b.createdAt);

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

    await axios.request(config);
}

// deleteFromThread
// API: DELETE
export async function deleteFromThread(questionId: string) {
    const time = getUnixTime();
    const hashMap: Map<string, string | boolean> = new Map();

    hashMap.set("ts", time.toString());
    hashMap.set("rt", "1");
    hashMap.set("ids", questionId);

    const endpoint = "/chats/messages";
    const signature = generateSignature(endpoint, "DELETE", hashMap);

    let config: AxiosRequestConfig = {
        method: "delete",
        url: `https://api.ask.fm/chats/messages?ids=${questionId}&rt=1&ts=${time}`,
        headers: {
            "X-Api-Version": "1.18",
            "X-Client-Type": "android_4.91.1",
            "X-Access-Token": import.meta.env.VITE_X_ACCESS_TOKEN,
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `HMAC ${signature}`
        }
    };

    await axios.request(config);
}
