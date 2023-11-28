import {AxiosRequestConfig} from "axios"
import axios from "axios";
import {generateSignature, getUnixTime} from "../askfm/generate_hash"


type Message = {
    fullName?: string,
    accountId?: string, 
    avatarUrl?: string,
    createdAt: number,
    text: string,
    isOwn: boolean,
}

type Answer = {
    type: string
    body: string
    createdAt: number
}

type RootAnswer = {
    avatarThumbUrl?: string
    author?: string
    authorName?: string
    createdAt: number
}

export type ThreadDetails = {
    root: RootAnswer
    answer: Answer
    messages: Message[]
}

// GetThreads
// API: GET answers/chats
// Params: ?limit=25&qid= 174009108712 &rt=17&ts=1700937407
export const getThreadsDetails = async (questionId: string): Promise<ThreadDetails>  => {
    const hashMap: Map<string, string | number> = new Map();

    hashMap.set("limit", 25)
    hashMap.set("qid", questionId)

    const endpoint = "/answers/chats"
    const time = getUnixTime() 
    const signature = generateSignature(endpoint, "GET", hashMap, time)

    let config:AxiosRequestConfig = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://api.ask.fm/answers/chats?limit=25&rt=1&ts=${time}&qid=${questionId}`,
      headers: { 
        'X-Api-Version': '1.18',
        'X-Client-Type': 'android_4.91.1',
        'X-Access-Token': import.meta.env.VITE_X_ACCESS_TOKEN,
        'Authorization': `HMAC ${signature}`
      }
    };
    const resp = await axios.request(config);
    const data = resp.data;
    const messages: Message[] = data?.messages || [];

    const threadDetails: ThreadDetails = {
        root: {
            author: data?.root?.author,
            authorName: data?.root?.authorName,
            avatarThumbUrl: data?.root?.avatarThumbUrl,
            createdAt: data?.root?.createdAt,
        },
        answer: {
            type: data?.root?.answer?.type,
            body: data?.root?.answer?.body,
            createdAt: data?.root?.answer?.createdAt,
        },
        messages: messages.map((message: any) => ({
          fullName: message.fullName,
          accountId: message.uid,
          avatarUrl: message.avatarUrl,
          createdAt: message.createdAt,
          text: message.text,
          isOwn: message.isOwn,
        })),
    };

    return threadDetails
}

// AddToThread
// API: POST /chats/messages
// Body: json=%7B%22anonymous%22%3A%22false%22%2C%22qid%22%3A%22174009108712%22%2C%22rt%22%3A%22253%22%2C%22text%22%3A%22dddd%22%2C%22ts%22%3A%221700945087%22%7D&
