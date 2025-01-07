import {
  Bot,
  InlineKeyboard,
  Keyboard,
  Context,
} from "https://deno.land/x/grammy@v1.34.0/mod.ts";

interface Movie {
  id: number;
  adult: boolean;
  title: string;
  release_date: string;
  poster_path: string;
  overview: string;
  vote_average: number;
  genres: {
    id: number;
    name: string;
  }[];
  runtime: number;
  credits: {
    cast: {
      name: string;
    }[];
  };
}
import "jsr:@std/dotenv/load";

const tmdbApiKey = Deno.env.get("TMDB_API_KEY")!;

type CallbackData = `next_movie_${number}`;

const bot = new Bot(Deno.env.get("TELEGRAM_BOT_TOKEN")!);
const tmdbApiEndPoint = "https://api.themoviedb.org/3/movie/";

let currentMovieIndex = 0;
let movies: Movie[] = [];

bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));
bot.command("help", (ctx) => ctx.reply("Help! I need somebody."));
bot.command("kys", (ctx) => ctx.reply("kys!"));
//Menu
bot.command("menu", async (ctx) => {
  const labels = [
    "Popular Movie",
    "Top Rated Movie",
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
    movies = [];
    const res = await fetch(`${tmdbApiEndPoint}popular`, {
      headers: {
        Authorization: `Bearer ${tmdbApiKey}`,
      },
    });
    const {
      results,
    }: {
      results: Movie[];
    } = await res.json();
    for (const movie of results) {
      const movieDetails = await fetchMovieDetails(movie.id);
      movies.push(movieDetails);
    }
    currentMovieIndex = 0;
    await sendMovieCard(ctx, currentMovieIndex);
  } catch (error) {
    console.error("Error fetching popular movies:", error);
    await ctx.reply("Failed to fetch popular movies.");
  }
});

bot.hears("Top Rated Movie", async (ctx) => {
  try {
    movies = [];
    const res = await fetch(`${tmdbApiEndPoint}top_rated`, {
      headers: {
        Authorization: `Bearer ${tmdbApiKey}`,
      },
    });
    const {
      results,
    }: {
      results: Movie[];
    } = await res.json();
    for (const movie of results) {
      const movieDetails = await fetchMovieDetails(movie.id);
      movies.push(movieDetails);
    }
    currentMovieIndex = 0;
    await sendMovieCard(ctx, currentMovieIndex);
  } catch (error) {
    console.error("Error fetching top rated movies:", error);
    await ctx.reply("Failed to fetch top rated movies.");
  }
});

const sendMovieCard = async (ctx: Context, movieIndex: number) => {
  const movie = movies[movieIndex];

  const nextMovieIndex = (movieIndex + 1) % movies.length;

  const previousMovieIndex = (movieIndex - 1 + movies.length) % movies.length;

  const inlineKeyboard = new InlineKeyboard()
    .text("Previous Movie", `previous_movie_${previousMovieIndex}`)
    .text("Next Movie", `next_movie_${nextMovieIndex}`);

  await ctx.replyWithPhoto(
    `https://image.tmdb.org/t/p/original/${movie.poster_path}`,
    {
      caption: `<strong>${movie.title}</strong>\n${
        movie.adult ? "Adult" : "PG-13"
      } / ${movie.runtime} / ${movie.genres
        .map((genre) => genre.name)
        .join(", ")} \n Summary       ${movie.vote_average} \n ${
        movie.overview
      } \n \n <i>${movie.credits.cast
        .slice(0, 3)
        .map((cast) => cast.name)
        .join(", ")}</i>`,
      parse_mode: "HTML",
      reply_markup: inlineKeyboard,
    }
  );
};

const fetchMovieDetails = async (movieId: number) => {
  const res = await fetch(
    `${tmdbApiEndPoint}${movieId}?append_to_response=credits&language=en-US`,
    {
      headers: {
        Authorization: `Bearer ${tmdbApiKey}`,
      },
    }
  );

  const data: Movie = await res.json();

  return data;
};

bot.on("callback_query:data", async (ctx: Context) => {
  const callbackQuery = ctx.callbackQuery;
  if (!callbackQuery) {
    return;
  }

  const data = callbackQuery.data;

  if (data!.startsWith("next_movie_")) {
    const index = parseInt(data!.split("_")[2]);

    currentMovieIndex = index;
    await sendMovieCard(ctx, currentMovieIndex);
  } else if (data!.startsWith("previous_movie_")) {
    const index = parseInt(data!.split("_")[2]);

    currentMovieIndex = index;
    await sendMovieCard(ctx, currentMovieIndex);
  }

  await ctx.answerCallbackQuery();
});

bot.start();
