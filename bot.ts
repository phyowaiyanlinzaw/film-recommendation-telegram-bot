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

type CallbackData = `next_movie_${number}`;

const bot = new Bot("7323791733:AAFhMNYka7fWW_9Vcrxyd7zwR_kagIPpI_Y");
const tmdbApiEndPoint = "https://api.themoviedb.org/3/movie/";
const tmdbApiKey =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4MDY2YmUxYjEzYTVkZjM5NDA3ZDlmNTgzZDU3OWQ1ZCIsIm5iZiI6MTY3MTI1MDYzNS42NDEsInN1YiI6IjYzOWQ0MmNiOWJjZDBmMDA4YzUxYWFjNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.0W3011-5E9-9E0MDSB8rf6x3eHy-FQn4R-3dBC-VU-o";

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
  const data = ctx.callbackQuery.data;

  if (data.startsWith("next_movie_")) {
    const index = parseInt(data.split("_")[2]);

    currentMovieIndex = (index + 1) % movies.length;
    await sendMovieCard(ctx, currentMovieIndex);
  }
  await ctx.answerCallbackQuery();
});

bot.start();
