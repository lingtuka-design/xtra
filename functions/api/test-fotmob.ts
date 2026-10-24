import { fotmobService } from '../services/fotmobService';

export const onRequestGet: PagesFunction = async () => {
  try {
    const res = await fotmobService.getMatchPhotos({
      homeTeam: 'Arsenal',
      awayTeam: 'Everton',
      winningTeam: 'Arsenal',
      winningScorers: ['Ezri Konsa', 'Gabriel Magalhães'],
      isDraw: false,
    });

    const ltcRes = await fetch('https://data.fotmob.com/webcl/ltc/gsm/5795485_en.json.gz', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    return Response.json({
      fotmobServiceResult: res,
      ltcStatus: ltcRes.status,
    });
  } catch (err: any) {
    return Response.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
};
