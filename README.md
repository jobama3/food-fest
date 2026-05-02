# Food Fest

A mobile web app for friends to hold casual food competitions with ranked choice voting.

## What it does

- Create events for food competitions
- Join an event with your name and the dish you brought
- Rank everyone else's dishes (not your own)
- See results computed via Instant Runoff Voting (IRV)

No accounts, no passwords — just a username per event for a private, friends-only experience.

## Stack

- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite via `better-sqlite3`
- **Frontend**: Alpine.js SPA with vanilla CSS (mobile-first, dark theme)
- **Deploy**: fly.io with a persistent volume for SQLite

## Running locally

```bash
npm install
npx ts-node src/index.ts
# open http://localhost:8080
```

## Deploying to fly.io

```bash
fly launch --no-deploy
fly volumes create food_fest_data --region <your-region> --size 1
fly deploy
```

---

## Origin

This app was created entirely from the following prompt to [Claude Code](https://claude.ai/code):

> I want to create a new mobile web app, backed by a simple db. Will probably deploy to fly.io since I already have a project deployed on that.
>
> At high level the web app will be for friends getting together for casual food competitions to vote on who's dish they liked the best. We'll use ranked choice voting to determine the results.
>
> The app's main screen will show all previous events and allow you to create an event.
>
> At the event level, you'll be able to add yourself as a participant (keyed only by user name per event, no password or auth needed, this will be a private app)
>
> Note: As part of creating yourself as a participant, you'll have to input what dish you brought by name.
>
> After you've created / logged in as a participant in an event, you'll see all the dishes that others brought (but not their user names) and be able to rank the others dishes according to what you liked the best. You'll only see your own votes here.
>
> There will be a See Results button, to go to a event results screen, that shows the overall ranking (based on total of ranked choice votes) for all the dishes.
