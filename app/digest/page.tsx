'use client';

import { useMemo, useState } from 'react';

type RedditListing = {
  data: { children: Array<{ data: any }> };
};

type ThreadPayload = [RedditListing, RedditListing];

function isValidThreadUrl(url: string) {
  try {
    const u = new URL(url);
    // Reddit JSON URLs
    if ((u.hostname.endsWith('reddit.com') || u.hostname.endsWith('redd.it')) && u.pathname.endsWith('.json')) {
      return 'reddit';
    }
    // Twitter/X URLs
    if (u.hostname.includes('twitter.com') || u.hostname.includes('x.com')) {
      return 'twitter';
    }
    return false;
  } catch {
    return false;
  }
}

function hoursSince(epochSec: number) {
  const now = Date.now() / 1000;
  const hours = (now - epochSec) / 3600;
  return Math.max(hours, 0.001);
}

function tokenize(text: string) {
  return (text || '')
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t && t.length > 2 && !STOPWORDS.has(t));
}

const STOPWORDS = new Set<string>([
  // minimal english stoplist; extend if needed
  'the','and','for','that','with','this','from','you','your','are','was','were','have','has',
  'but','not','just','any','out','get','can','cant','won','wont','its','they','them','their',
  'what','when','where','which','why','who','how','did','does','doing','done','had','been',
  'into','over','under','than','then','too','very','much','more','less','also','some','here',
  'there','like','one','two','three','able','about','such'
]);

function topN<T extends string | number>(counts: Record<string, number>, n = 10): Array<[T, number]> {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n) as Array<[T, number]>;
}

function bigrams(tokens: string[]) {
  const pairs: Record<string, number> = {};
  for (let i = 0; i < tokens.length - 1; i++) {
    const k = `${tokens[i]} ${tokens[i + 1]}`;
    if (!pairs[k]) pairs[k] = 0;
    pairs[k] += 1;
  }
  return pairs;
}

function extractLinks(text: string) {
  const links = text.match(/https?:\/\/[^\s)]+/g) || [];
  return links.map((l) => {
    try {
      const u = new URL(l.replace(/[),.]+$/, ''));
      return { url: u.toString(), domain: u.hostname.replace(/^www\./, '') };
    } catch {
      return null;
    }
  }).filter(Boolean) as { url: string; domain: string }[];
}

const POS_WORDS = new Set(['good','great','love','helpful','nice','amazing','cool','thanks','thank','awesome','best','useful']);
const NEG_WORDS = new Set(['bad','hate','terrible','annoying','broken','issue','bug','worst','useless','problem','confusing']);

function naiveSentiment(text: string): 'positive'|'negative'|'neutral' {
  const toks = tokenize(text);
  let p = 0, n = 0;
  toks.forEach(t => {
    if (POS_WORDS.has(t)) p++;
    if (NEG_WORDS.has(t)) n++;
  });
  if (p > n) return 'positive';
  if (n > p) return 'negative';
  return 'neutral';
}

export default function DigestPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [payload, setPayload] = useState<ThreadPayload | null>(null);
  const [threadType, setThreadType] = useState<'reddit' | 'twitter' | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setPayload(null);
    setThreadType(null);
    
    const urlType = isValidThreadUrl(url);
    if (!urlType) {
      setErr('Please paste a valid Reddit (.json) or Twitter/X thread URL');
      return;
    }
    
    setThreadType(urlType);
    setLoading(true);
    
    try {
      if (urlType === 'reddit') {
        // Reddit supports CORS for json; no token needed for public threads.
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as ThreadPayload;
        if (!Array.isArray(data) || data.length < 2) throw new Error('Unexpected payload shape');
        setPayload(data);
      } else if (urlType === 'twitter') {
        // For Twitter, we'll need to use a different approach since Twitter doesn't have public JSON API
        // For now, we'll show a placeholder message
        setErr('Twitter thread analysis coming soon. Please use Reddit .json URLs for now.');
        setLoading(false);
        return;
      }
    } catch (e: any) {
      setErr(`Failed to fetch/parse: ${e?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  const analysis = useMemo(() => {
    if (!payload) return null;

    // POST
    const post = payload[0]?.data?.children?.[0]?.data || {};
    const commentsRaw = payload[1]?.data?.children || [];

    // COMMENTS (flatten top-level only for speed; can extend to depth)
    const comments = commentsRaw
      .map((c: any) => c?.data)
      .filter(Boolean)
      .filter((c: any) => typeof c.body === 'string');

    const hours = hoursSince(post.created_utc || 0);
    const velocity = (post.score || 0) / hours;
    const commentDensity = (post.num_comments || 0) / hours;
    const controversy = (post.num_comments || 0) / Math.max(post.score || 0, 1);

    // Keywords
    const titleTokens = tokenize(post.title || '');
    const commentTokens = tokenize(comments.map((c: any) => c.body).join(' '));
    const allTokens = [...titleTokens, ...commentTokens];

    const unigramCounts: Record<string, number> = {};
    allTokens.forEach(t => { unigramCounts[t] = (unigramCounts[t] || 0) + 1; });

    const biCounts = bigrams(allTokens);

    // Links
    const postLink = extractLinks(post.selftext || '').concat(
      post.url ? extractLinks(post.url) : []
    );
    const commentLinks = comments.flatMap((c: any) => extractLinks(c.body));
    const allLinks = [...postLink, ...commentLinks];
    const domainCounts: Record<string, number> = {};
    allLinks.forEach(l => { domainCounts[l.domain] = (domainCounts[l.domain] || 0) + 1; });

    // Sentiment (quick & dirty)
    let pos = 0, neg = 0, neu = 0;
    comments.slice(0, 50).forEach((c: any) => {
      const s = naiveSentiment(c.body);
      if (s === 'positive') pos++; else if (s === 'negative') neg++; else neu++;
    });

    // Questions / CTA hints
    const questionRate =
      comments.length ? (comments.filter((c: any) => c.body.includes('?')).length / comments.length) : 0;

    // Top comments
    const topComments = [...comments]
      .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
      .slice(0, 5);

    return {
      post: {
        subreddit: post.subreddit,
        title: post.title,
        author: post.author,
        created_utc: post.created_utc,
        permalink: `https://www.reddit.com${post.permalink || ''}`,
        url: post.url_overridden_by_dest || post.url || '',
        domain: post.domain,
        score: post.score,
        upvote_ratio: post.upvote_ratio,
        num_comments: post.num_comments,
        awards: post.total_awards_received,
        flair: post.link_flair_text,
        is_video: post.is_video,
        is_gallery: post.is_gallery,
        gallery_count: post.gallery_data?.items?.length || 0,
        crossposts: (post.crosspost_parent_list || []).length,
      },
      metrics: {
        hours_live: +hours.toFixed(2),
        velocity_score_per_hr: +velocity.toFixed(2),
        comments_per_hr: +commentDensity.toFixed(2),
        controversy_ratio: +controversy.toFixed(2),
      },
      keywords: {
        top_unigrams: topN(unigramCounts, 12),
        top_bigrams: topN(biCounts, 8),
      },
      links: {
        top_domains: topN(domainCounts, 8),
        samples: allLinks.slice(0, 10),
      },
      sentiment: { positive: pos, negative: neg, neutral: neu },
      question_rate: +questionRate.toFixed(2),
      top_comments: topComments.map((c: any) => ({
        author: c.author,
        score: c.score,
        body: c.body,
        permalink: c.permalink ? `https://www.reddit.com${c.permalink}` : '',
        depth: c.depth,
        is_submitter: c.is_submitter,
      })),
    };
  }, [payload]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Digest</h1>
      <p className="mt-1 text-sm opacity-70">Paste a Reddit (.json) or Twitter/X thread URL to extract insights.</p>

      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <input
          className="w-full border border-black px-3 py-2 text-sm outline-none focus:ring-0"
          placeholder="https://www.reddit.com/r/SomeSub/comments/abcdef/thread-title/.json or https://twitter.com/user/status/123456"
          value={url}
          onChange={(e) => setUrl(e.target.value.trim())}
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
        />
        <button
          type="submit"
          className="border border-black px-4 py-2 text-sm font-medium hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition"
          disabled={loading}
        >
          {loading ? 'Loading…' : 'Analyze'}
        </button>
      </form>

      {err && (
        <div className="mt-3 border border-black p-3 text-sm bg-white">
          <div className="font-medium">Error</div>
          <div className="opacity-80">{err}</div>
        </div>
      )}

      {!loading && !err && !analysis && (
        <div className="mt-6 text-sm opacity-70">
          Example: add <code>.json</code> to any Reddit thread URL, or paste a Twitter/X thread URL.
        </div>
      )}

      {loading && (
        <div className="mt-6 border border-black p-4 text-sm animate-pulse">Fetching & parsing…</div>
      )}

      {analysis && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Post summary */}
          <div className="lg:col-span-1 space-y-4">
            <section className="border border-black p-4">
              <div className="text-xs uppercase opacity-60">Post</div>
              <h2 className="mt-1 font-medium">{analysis.post.title}</h2>
              <div className="mt-2 text-sm space-y-1">
                <div><span className="opacity-60">Subreddit:</span> r/{analysis.post.subreddit}</div>
                <div><span className="opacity-60">Author:</span> u/{analysis.post.author}</div>
                <div><span className="opacity-60">Flair:</span> {analysis.post.flair || '—'}</div>
                <div><span className="opacity-60">Media:</span> {analysis.post.is_gallery ? `Gallery (${analysis.post.gallery_count})` : analysis.post.is_video ? 'Video' : '—'}</div>
                <div className="flex gap-3 flex-wrap mt-2">
                  <a className="underline" href={analysis.post.permalink} target="_blank">Thread</a>
                  {analysis.post.url && <a className="underline" href={analysis.post.url} target="_blank">Post link</a>}
                </div>
              </div>
            </section>

          </div>

          {/* Right column: Insights */}
          <div className="lg:col-span-2 space-y-6">
            <section className="border border-black p-4">
              <div className="text-xs uppercase opacity-60">Themes</div>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {analysis.keywords.top_unigrams.map(([k, v]) => (
                  <div key={k} className="border border-black px-2 py-1 flex items-center justify-between">
                    <span>{k}</span><span className="opacity-60">{v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-xs uppercase opacity-60">Key phrases</div>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {analysis.keywords.top_bigrams.map(([k, v]) => (
                  <div key={k} className="border border-black px-2 py-1 flex items-center justify-between">
                    <span>{k}</span><span className="opacity-60">{v}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="border border-black p-4">
              <div className="text-xs uppercase opacity-60">Linked domains</div>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {analysis.links.top_domains.map(([d, c]) => (
                  <div key={d} className="border border-black px-2 py-1 flex items-center justify-between">
                    <span>{d}</span><span className="opacity-60">{c}</span>
                  </div>
                ))}
              </div>
              {analysis.links.samples.length > 0 && (
                <>
                  <div className="mt-4 text-xs uppercase opacity-60">Sample links</div>
                  <ul className="mt-2 space-y-1 text-sm">
                    {analysis.links.samples.map((l, i) => (
                      <li key={i} className="truncate"><a className="underline" href={l.url} target="_blank">{l.url}</a></li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            <section className="border border-black p-4">
              <div className="text-xs uppercase opacity-60">Conversation snapshot</div>
              <div className="mt-2 text-sm flex gap-4">
                <div>🙂 {analysis.sentiment.positive}</div>
                <div>😐 {analysis.sentiment.neutral}</div>
                <div>🙁 {analysis.sentiment.negative}</div>
                <div className="opacity-60">Question rate: {analysis.question_rate}</div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysis.top_comments.map((c, i) => (
                  <div key={i} className="border border-black p-3">
                    <div className="text-xs opacity-60 mb-1">u/{c.author} • {c.score} pts {c.is_submitter ? '• OP' : ''}</div>
                    <div className="text-sm whitespace-pre-wrap">{c.body}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
