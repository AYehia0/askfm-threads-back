# Threads-Back
The aim of this project is to return the threads back to the askfm web version, as askfm decided to just nuke this feature to make you download the mobile version.

## How am I going to do this ?
The idea is pretty simple :
- Intercept the network traffic and play with their API.
- Create a web extension that calls that API and modify the HTML to display the answers in the thread.

## Process
When I first launch the application and intercept the traffic.

- I noticed that `/config?rt=1&ts=1698947119` is first called which is used to fetch some metrics about the application and the environment.
  - `rt`: idk what the heck is this, maybe request type.
  - `ts`: current timestamp (to convert to readable date: `date -d @1698947119`)
- Second api route called is (as you guessed) `/token?adid=b5d89833-7b09-4f29-8357-a5994ca09e76&did=6dc885091e5342ce&rt=1&ts=1698947119`, which is called 3 times and last accessToken is the used one!
  - `adid`: maybe ad id idk (`uuidv4`) : `PayloadBuilder advertisingId = new PayloadBuilder().username(this.username).password(this.password).deviceId().guid().advertisingId();`, guid(device_id) : "android_id"
  - `did`: device id (`did = Math.random().toString(16).substr(2, 16)`)
  - The response:
    - ```json
      {
          "accessToken": ".5oLGteOjKpQwBrNfrjk0NbmWyUUc",
          "serverTime": 1698947119
      }
      ```
 
## HTTP required params and headers
The target API : `https://api.ask.fm/answers/chats?limit=25&qid={question_id}&rt=29&ts={timestamp}`

### Headers
```
    accept: application/json; charset=utf-8
    accept-encoding: identity
    authorization: HMAC f5a7d9e4b60004a13f13be7a2a1e42b23c5de4d3
    connection: Keep-Alive
    host: api.ask.fm:443
    user-agent: Dalvik/2.1.0 (Linux; U; Android 11; Phone Build/RQ1A.210105.003)
    x-access-token: .3G4KsfJ0NDu6JfAgvuB4kkS-v4sK2
    x-api-version: 1.18
    x-client-type: android_4.90.7
    x-forwarded-proto: https
```

The `authorization` : HMAC-SHA1 (I think).
The `x-api-version` is required for this call.
There must be away to generate the HMAC key:
- Unpack the APK and search for the secret key for hashing the HMAC.

### Params

- `qid=` : question_id
- `rt=` : nextRequestToken
- `ts=` : timestamp/???

## Resources

- [Mobile Security Framework](https://github.com/MobSF/Mobile-Security-Framework-MobSF)

## ToDo
- [X] Discover the API params for that API route.
- [X] Test if the java code actually generates the the HMAC.
- [ ] Test using a python script.
- [ ] Translate the `java` code into `js`.
- [ ] Create a web extension.
