const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbpath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const dbObjectToObjectResponse = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
    playerMatchId: dbObject.player_match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};
//API 1

app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    SELECT * FROM player_details;`;
  const player = await db.all(getPlayerQuery);
  response.send(player.map((each) => dbObjectToObjectResponse(each)));
});

//API 2
app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerIdQuery = `SELECT * FROM player_details
    WHERE player_id = '${playerId}';`;
  const player = await db.get(getPlayerIdQuery);
  response.send(dbObjectToObjectResponse(player));
});

//API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerName } = request.body;
  const { playerId } = request.params;
  const putPlayerQuery = `
    UPDATE 
        player_details
    SET
        player_name = '${playerName}'
    WHERE
         player_id = '${playerId}';`;
  await db.run(putPlayerQuery);
  response.send("Player Details Updated");
});

//API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT * FROM match_details
    WHERE match_id = '${matchId}';`;
  const match = await db.get(getMatchQuery);
  response.send(dbObjectToObjectResponse(match));
});

//API 5

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getListPlayerQuery = `
    SELECT match_id,
           match,
           year
    FROM player_match_score
    NATURAL JOIN match_details
    WHERE player_id = '${playerId}';`;
  const match = await db.all(getListPlayerQuery);
  response.send(match.map((each) => dbObjectToObjectResponse(each)));
});

//API 6(
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getListMatchQuery = `
     SELECT player_id,
            player_name
     FROM 
     player_match_score
     NATURAL JOIN player_details
     WHERE match_id = '${matchId}';`;
  const player = await db.all(getListMatchQuery);
  response.send(player.map((each) => dbObjectToObjectResponse(each)));
});

//API 7
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getScoreQuery = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = '${playerId}';`;
  const score = await db.get(getScoreQuery);
  response.send(score);
});

module.exports = app;
