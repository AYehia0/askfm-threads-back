// reimplement the Signature class to js
const crypto = require('crypto');
const axios = require('axios');

// Get the private API key using frida : check out the README.md
const privateKey = "";

const getEndPoint = (endpoint) => {
    return endpoint
}

const getHostWithPort = () => {
    const host = "api.ask.fm"
    const port = 443
    return `${host}:${port}`
}

const getRequestMethodString = (key) => {
    // map which contains all the requests with their corresponding ints
    // the number indicates GET: 0, 
    function methodAsString(i) {
        const methodMap = new Map([
            [0, 'GET'],
            [1, 'POST'],
            [2, 'PUT'],
            [3, 'DELETE'],
        ]);

        const methodName = methodMap.get(i);

        if (methodName === undefined) {
            throw new Error('Invalid request method code');
        }

        return methodName;
    }
    // add all to the store.
    const store = {
        "token": 0,
    }
    return methodAsString(store[key])
}

const getUnixTime = () => {
    return Math.floor(new Date().getTime()/1000); 
}

const generateParamsByMethod = (key) => {

    const hashMap = new Map();

    hashMap.set("rt", "1")
    hashMap.set("ts", getUnixTime())

    hashMap.set("uid", "annome8909")

    // a post/put request
    if (getRequestMethodString(key) == "POST" || getRequestMethodString(key) == "PUT") {
        // convert params to POST
        const jsonPayload = JSON.stringify(hashMap)
        return jsonPayload
    }

    return hashMap
}


// Function to concatenate a list with a separator
const concatenateList = (list, str) => {
    if (list.length === 0) {
        return '';
    }

    const sb = [list[0]];
    const size = list.length;

    for (let i = 1; i < size; i++) {
        sb.push(str);
        sb.push(list[i]);
    }

    return sb.join('');
}

// Function to perform URL encoding with additional replacements
const customEncode = (str) => {
    if (str !== null) {
        try {
            const encoded = encodeURIComponent(str);
            const result = encoded
                .replace(/%7E/g, '~')
                .replace(/%29/g, ')')
                .replace(/%28/g, '(')
                .replace(/%27/g, "'")
                .replace(/%21/g, '!')
                .replace(/\+/g, '%20');

            return result;
        } catch (e) {
            console.error('Error encoding:', e);
            return str;
        }
    }

    return '';
}

// serialize params 
const serializeParams = (data) => {
    const arrayList = [];

    data.forEach((value, key) => {
        if (value !== null) {
            const encodedValue = customEncode(value.toString());
            const result = customEncode(key) + '%' + encodedValue;
            arrayList.push(result);
        }
    })

    arrayList.sort();
    return concatenateList(arrayList, '%');
}

// the main function to generate the hash using SHA-1
const generateHash = (requestMethodString, hostWithPort, endPoint, params, secret) => {

    const appendHex = (b) => {
        const hex = ('0' + (b & 0xFF).toString(16)).slice(-2);
        return hex;
    }

    const sha1 = (s, keyString) => {
        const hmac = crypto.createHmac('sha1', keyString);

        hmac.update(s, 'utf-8');
        const digest = hmac.digest();

        const stringBuffer = [];
        for (let i = 0; i < digest.length; i++) {
            stringBuffer.push(appendHex(digest[i]));
        }

        const result = stringBuffer.join('');
        return result.toLowerCase();
    }

    const serialized = serializeParams(params)

    return sha1(requestMethodString + "%" + hostWithPort + "%" +  endPoint + "%" + serialized, secret)
}

function getSignature() {
    // get requestMethodString
    const keyToken = "token" // GET request to the current url
    const requestMethodString = getRequestMethodString(keyToken)
    const hostWithPort = getHostWithPort()
    const endPoint = getEndPoint("/users/details")
    const hash = generateHash(requestMethodString, hostWithPort, endPoint, generateParamsByMethod(keyToken), privateKey)
    return hash
}

const getUserData = () => {
    const hash = getSignature()
    const username = "annome8909"
    const time = getUnixTime()
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://api.ask.fm/users/details?rt=1&ts=${time}&uid=${username}`,
      headers: { 
        'X-Api-Version': '1.18',
        'X-Client-Type': 'android_4.91.1',
        'X-Access-Token': 'XXXXXXXXXXXXXXXXXXX', // get the X-Access-Token from any request : check out the blog I wrote here : https://ayehia0.github.io/posts/askfm_reverse_engineering/
        'Host': 'api.ask.fm:443',
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 11; Phone Build/RQ1A.210105.003)',
        'Authorization': `HMAC ${hash}`
      }
    };
    axios.request(config).then((response) => {
        console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
        console.log(error);
    });
}

const signatureHash = getSignature()

console.log("Generated Hash : ", signatureHash)

getUserData()
