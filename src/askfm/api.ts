import { AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";
import { generateSignature } from "../askfm/generate_hash";
import { ThreadDetails, Message } from "./api.types.ts";
import {
    getUnixTime,
    buildUrl,
    extractThreadDetails,
    extractMessageDetails,
    getHeaders
} from "./api.helpers.ts";

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
            ...getHeaders(),
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
            threadDetails = extractThreadDetails(resp);
        } else {
            threadDetails.messages = threadDetails.messages.concat(
                messages.map((message: any) =>
                    extractMessageDetails(message, resp.headers.login)
                )
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
            ...getHeaders(),
            "Content-Type": "application/x-www-form-urlencoded",
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
            ...getHeaders(),
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `HMAC ${signature}`
        }
    };

    await axios.request(config);
}
