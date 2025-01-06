import {
  Bot,
  InlineKeyboard,
  Keyboard,
  Context,
} from "https://deno.land/x/grammy@v1.34.0/mod.ts";

interface Movie {
  title: string;
  release_date: string;
  poster_path: string;
  overview: string;
  vote_average: number;
  genres_ids: number[];
}
import "jsr:@std/dotenv/load";

const tmdbApiKey = Deno.env.get("TMDB_API_KEY")!;

type CallbackData = `next_movie_${number}`;

const bot = new Bot(Deno.env.get("TELEGRAM_BOT_TOKEN")!);
const tmdbApiEndPoint = "https://api.themoviedb.org/3/movie/";

let currentMovieIndex = 0;
let movies: Movie[] = [];

bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));

//Menu
bot.command("menu", async (ctx) => {
  const labels = [
    "Popular Movie",
    "Random Movie",
    "Recommendation by My Choice",
  ];
  const buttonRows = labels.map((label) => [Keyboard.text(label)]);
  const menuKeyboard = Keyboard.from(buttonRows).resized();

  await ctx.reply("Choose an option:", {
    reply_markup: menuKeyboard,
  });
});

bot.hears("Popular Movie", async (ctx) => {
  try {
    const res = await fetch(`${tmdbApiEndPoint}popular`, {
      headers: {
        Authorization: `Bearer ${tmdbApiKey}`,
      },
    });
    const data = await res.json();
    movies = data.results;
    currentMovieIndex = 0;
    await sendMovieCard(ctx, currentMovieIndex);
  } catch (error) {
    console.error("Error fetching popular movies:", error);
    await ctx.reply("Failed to fetch popular movies.");
  }
});

const sendMovieCard = async (ctx: Context, movieIndex: number) => {
  const movie = movies[movieIndex];

  const inlineKeyboard = new InlineKeyboard()
    .text("Previous Movie", `next_movie_${movieIndex - 1}`)
    .text("Next Movie", `next_movie_${movieIndex}`);

  await ctx.replyWithPhoto(
    `https://image.tmdb.org/t/p/original/${movie.poster_path}`,
    {
      caption: `<b>${movie.title}</b>\n${movie.overview}`,
      parse_mode: "HTML",
      reply_markup: inlineKeyboard,
    }
  );
};

bot.on("callback_query:data", async (ctx: Context) => {
  // Check if callbackQuery is defined
  const callbackQuery = ctx.callbackQuery;
  if (!callbackQuery) {
    return; // If callbackQuery is not defined, do nothing
  }

  const data = callbackQuery.data;

  if (data!.startsWith("next_movie_")) {
    const index = parseInt(data!.split("_")[2]);

    currentMovieIndex = (index + 1) % movies.length;
    await sendMovieCard(ctx, currentMovieIndex);
  }

  await ctx.answerCallbackQuery();
});

bot.start();
