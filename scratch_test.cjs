const fs = require('fs');

async function test() {
  const matchedId = 5795485;
  const [detailsRes, ltcRes] = await Promise.all([
    fetch("https://www.fotmob.com/api/data/matchDetails?matchId=" + matchedId, { headers: { "User-Agent": "Mozilla/5.0" } }),
    fetch("https://data.fotmob.com/webcl/ltc/gsm/" + matchedId + "_en.json.gz", { headers: { "User-Agent": "Mozilla/5.0" } })
  ]);
  const ltcData = await ltcRes.json();
  const detailsData = await detailsRes.json();

  const candidates = [];
  const pulseItems = ltcData.PulseInfo?.Items || [];
  for (const item of pulseItems) {
    const imgContent = item.Content?.find(c => c.Type === "image" && c.Media?.[0]?.Url);
    if (imgContent?.Media?.[0]?.Url) {
      candidates.push({
        url: imgContent.Media[0].Url,
        title: item.Content?.find(c => c.Type === "title")?.Translations?.en || "",
        text: item.Content?.find(c => c.Type === "text")?.Translations?.en || "",
        elapsed: item.Elapsed,
        source: "commentary"
      });
    }
  }

  const content = detailsData.content || {};
  const contentStr = JSON.stringify(content);
  const regex = /https?:\/\/[^"\s']+\.(?:jpg|jpeg|png|webp)/gi;
  const matches = contentStr.match(regex) || [];
  const contentPhotos = [...new Set(matches)].filter((url) => {
    const u = url.toLowerCase();
    const isActionHost =
      u.includes('performgroup.com') ||
      u.includes('stories.dazn.com') ||
      u.includes('fotmob.com/wp-content') ||
      u.includes('images.fotmob.com/images/pulse') ||
      u.includes('images.fotmob.com/image_resources/playerimages');
    const isUi =
      u.includes('logo') ||
      u.includes('teamlogo') ||
      u.includes('heatmap') ||
      u.includes('fallback') ||
      u.includes('weather') ||
      u.includes('badge');
    return isActionHost && !isUi;
  });

  for (const u of contentPhotos) {
    if (!candidates.some((c) => c.url === u)) {
      candidates.push({
        url: u,
        title: '',
        text: '',
        source: 'content',
      });
    }
  }

  console.log("Total candidates:", candidates.length);
  candidates.forEach((c, idx) => console.log(idx, c.source, c.url, c.title));

  // Now run scoring
  const options = {
    winningTeam: 'Arsenal',
    winningScorers: ['Ezri Konsa', 'Gabriel Magalhães'],
    isDraw: false
  };

  const winTokens = [];
  if (options.winningTeam) winTokens.push(...options.winningTeam.toLowerCase().split(/\s+/));
  if (options.winningScorers) {
    options.winningScorers.forEach((s) => winTokens.push(...s.toLowerCase().split(/\s+/)));
  }

  const cleanTokens = (arr) =>
    [...new Set(arr.filter((t) => t.length >= 3 && !['the', 'and', 'for', 'city', 'town', 'united'].includes(t)))];

  const wTokens = cleanTokens(winTokens);
  console.log('wTokens:', wTokens);

  let bestCandidate = candidates[0];
  let bestScore = -999;

  for (const cand of candidates) {
    let score = 0;
    if (cand.source === 'commentary') score += 100;
    const info = (cand.url + ' ' + cand.title + ' ' + cand.text).toLowerCase();

    const hasWinner = wTokens.some((t) => info.includes(t));
    if (hasWinner) score += 90;

    if (info.includes('goal') || info.includes('celebrat')) score += 30;

    console.log('Score for cand:', cand.url, '=>', score, 'title:', cand.title);
    if (score > bestScore) {
      bestScore = score;
      bestCandidate = cand;
    }
  }

  console.log('SELECTED BEST PHOTO:', bestCandidate.url);
}

test();
