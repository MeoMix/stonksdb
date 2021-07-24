import express from 'express';
import cors from 'cors';
import storage from 'node-persist';

// TODO: I had to put TS in non-strict mode for this to work.
import CoinGecko from 'coingecko-api';

const app = express();

// app.use(cors());

// app.use(function(req, res, next) {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader("Access-Control-Allow-Credentials", 'true');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
//   res.setHeader('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });

const PORT = 8000;
app.get('/', (req,res) => res.send('Express + TypeScript Server RAWR'));

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});

async function foo() {
  const ethereum = await storage.getItem('coingecko');
  const counter = await storage.getItem('counter');
  const seed = await storage.getItem('seed');

  console.log('sending ethereum from/to', seed, seed + counter + 7)

  return {
    counter,
    ethereum: ethereum.slice(seed, seed + counter + 7 ),
    seed,
  }
}

app.get('/counter', async (req, res) => {
  res.send((await foo()));
});

app.get('/ssb', async (req, res) => {
  const ssb = await storage.getItem('ssb');

  res.send({ ssb });
});

app.get('/coingecko', async (req, res) => {
  const ethereum = await storage.getItem('coingecko');

  res.send({ ethereum });
});

app.get('/coingecko-random', async (req, res) => {
  await storage.setItem('counter', 0);
  await storage.setItem('seed', Math.floor(Math.random() * 100) + 1);

  res.send((await foo()));
});

app.post('/counter', async (req, res) => {
  const currentCounter = await storage.getItem('counter');
  const nextCounter = currentCounter + 1;

  // TODO: consider failures
  await storage.setItem('counter', nextCounter);

  res.send((await foo()));
});

(async () => {
  await storage.init({ logging: true });

  // DEMO: initialize counter
	let counter = await storage.getItem('counter');
	if (!counter) {
		await storage.setItem('counter', 0);
	}

  let seed = await storage.getItem('seed');
	if (!seed) {
		await storage.setItem('seed', 0);
	}

  // TODO: don't hit Reddit on initialize if data in storage is still fresh
  // DEMO: initialize ssb post data
  // const RedditClient = new snoowrap(RedditSecrets);
  // const subreddit = RedditClient.getSubreddit("SatoshiStreetBets");
  // const topPosts = await subreddit.getTop({ time: 'hour', limit: 20 });
  // const topPostData = topPosts.map((post) => ({
  //   id: post.id,
  //   link: post.url,
  //   text: post.title,
  //   score: post.score
  // }));

  // const thread = await topPosts[0].expandReplies({ limit: 10, depth: 10 });
  // console.log("comment count", thread.comments.length);
  // thread.comments.forEach((comment) => console.log(comment.body));
  // await storage.setItem('ssb', topPostData);

  // https://api.coingecko.com/api/v3/coins/ethereum/ohlc?vs_currency=usd&days=31

  // DEMO: initialize coingecko ethereum price data
  const CoinGeckoClient = new CoinGecko();
  const { data } = await CoinGeckoClient._request('/coins/ethereum/ohlc', {
    vs_currency: ['usd'],
    days: 30,
  });

  console.log('set coingecko data', data.length);

  await storage.setItem('coingecko', data);
})();