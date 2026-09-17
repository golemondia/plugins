# The stored side: provenance, import defaults, and the read tools

## Why the stored number may be fiction

Most Lemondia venues were bulk imported from a places feed that carries no capacity. The
import therefore fills the gap with defaults, and records that it did:

| stored column | if the venue stated it | if it did not |
|---|---|---|
| `GuestRooms` | as stated | `10`, except for non-residential venue types, which get none |
| `MeetingRooms` | as stated | `1` |
| `ConferenceRoomCapacity` | as stated | stored rooms x `2`, so `20` when no room count exists |

Consequences for the report:

- Use `capacity.estimated.<field>` together with `provenance.fields` to describe the
  stored number's origin. Use the defaults above only to explain a documented estimate.
  A number matching a default is not by itself proof of estimation; absence of an estimate
  flag is not independent verification.
- `0` and null both mean "nobody told us". Never render either as a capacity of zero.
  `capacity.effective` is the same values with the zeros nulled out.
- Room counts are mostly real; meeting-room counts are the weakest field; capacity is
  frequently our own arithmetic.

## Provenance origins

`Lemondia_Venues.Provenance` is per-field JSON. Version 1 records an `origin` per field;
version 2 records a chosen claim plus the list of competing claims, and an `enrichment`
block logging past attempts, including ones that found nothing. Both spell origin the
same way:

- `stated`: read off the venue's own site or its listing. Real, but possibly stale.
- `estimated`: we invented it. Web evidence outranks it.
- `claimed` / `operator`: a human at the venue or an operator set it. Flag it as human-set,
  not as independently verified or necessarily current. Report any disagreement.
- absent for a field: unattributed legacy value. Reliability is unknown.

`ClaimedAt` not null means a venue manager controls the venue. Still read-only, and a
conflict there is more interesting, not less: the human who typed it can be asked.

Use `contact.website` from the context tool when it passes the public-URL safety checks.
Otherwise search by venue name and address. Judge confidence from the source actually
found, not from whether the original record contained a website.

## Reading more than the context tool returns

`get_inquiry_research_context` is the entry point and normally enough. When a field is
missing, use the structured read tools rather than guessing:

- `tables` takes no input and lists readable tables. `describe` takes `{table}` and
  returns each column with `dataType`, `nullable`, `isPrimaryKey` and `references`.
  `relationships` takes `{table}` and returns `outgoing` and `incoming` foreign keys.
  `search_columns` takes `{pattern}` and finds a column by name across tables. `enums`
  takes an optional `{name}` and maps stored ints to labels (currency, statuses).
- `query` is structured and accepts no SQL string. `sql` (admin role only) takes one read-only SELECT (joins
  allowed) when a structured read cannot express what you need; every call runs in a rolled-back transaction.

```
{
  table: string,
  columns?: string[],                                  // <= 60, ask for only what you read
  filters?: [{ column, op, value?, values? }],         // <= 20
  orderBy?: [{ column, direction?: 'asc' | 'desc' }],  // <= 5
  maxRows?: number,                                    // default 100, max 1000
  offset?: number                                      // default 0
}
```

  `op` is one of `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in` (with `values`, at most 50),
  `isNull`, `isNotNull`, `contains`, `startsWith`. A string value is capped at 200 chars.
  The result is `{table, columns, returned, maxRows, offset, hasMore, rows}`; page with
  `offset` while `hasMore` is true.

Access is allowlisted per role: an operator role can read only an explicit set of tables
and columns, an admin role can read user tables broadly. A denial is a policy answer, not
a bug: report the field as `not researched` because the role may not read it, and move on.
Do not try to route around a denial through another table.

Keep reads small. This is a research pass over one inquiry, not an export.
