// eslint-disable-next-line @typescript-eslint/no-require-imports
const dynalite = require("dynalite") as (opts?: {
  createTableMs?: number;
  deleteTableMs?: number;
  updateTableMs?: number;
}) => {
  listen: (port: number, cb: (err?: Error) => void) => void;
};

const port = Number(process.env.DYNAMODB_PORT ?? 8000);

const server = dynalite({ createTableMs: 0, deleteTableMs: 0, updateTableMs: 0 });

server.listen(port, (err?: Error) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Dynalite listening on http://localhost:${port}`);
});
