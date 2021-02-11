import express from 'express';
import cors from 'cors';
import storage from 'node-persist';
import snoowrap from 'snoowrap';

// TODO: I had to put TS in non-strict mode for this to work.
import CoinGecko from 'coingecko-api';

import RedditSecrets from './redditSecrets';

const app = express();

app.use(cors());

const PORT = 8000;
app.get('/', (req,res) => res.send('Express + TypeScript Server RAWR'));

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});

app.get('/counter', async (req, res) => {
  const counter = await storage.getItem('counter');

  res.send({ counter });
});

app.get('/ssb', async (req, res) => {
  const ssb = await storage.getItem('ssb');

  res.send({ ssb });
});

app.get('/coingecko', async (req, res) => {
  const ethereum = await storage.getItem('coingecko');

  res.send({ ethereum });
});

app.post('/counter', async (req, res) => {
  const currentCounter = await storage.getItem('counter');
  const nextCounter = currentCounter + 1;

  // TODO: consider failures
  await storage.setItem('counter', nextCounter);

  res.send({ counter: nextCounter });
});

(async () => {
  await storage.init({ logging: true });

  // DEMO: initialize counter
	let counter = await storage.getItem('counter');
	if (!counter) {
		await storage.setItem('counter', 0);
	}

  // TODO: don't hit Reddit on initialize if data in storage is still fresh
  // DEMO: initialize ssb post data
  const RedditClient = new snoowrap(RedditSecrets); 
  const subreddit = RedditClient.getSubreddit("SatoshiStreetBets");
  const topPosts = await subreddit.getTop({ time: 'hour', limit: 20 });
  const topPostData = topPosts.map((post) => ({
    id: post.id,
    link: post.url,
    text: post.title,
    score: post.score
  }));

  // const thread = await topPosts[0].expandReplies({ limit: 10, depth: 10 });
  // console.log("comment count", thread.comments.length);
  // thread.comments.forEach((comment) => console.log(comment.body));
  await storage.setItem('ssb', topPostData);

  // DEMO: initialize coingecko ethereum price data
  const CoinGeckoClient = new CoinGecko();
  const { data: { ethereum } } = await CoinGeckoClient.simple.price({
    ids: ['ethereum'],
    vs_currencies: ['usd'],
  });

  await storage.setItem('coingecko', ethereum);
})();