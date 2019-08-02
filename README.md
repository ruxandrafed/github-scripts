# github-scripts

Scripts to get various info from Github repos. All output is CSV and will be generated under `./output`.

Current options include:

### Get all current user/org repositories

- Input: user/org
- Output: `output/repos-<user/org>-yyyy-mm-dd.csv` (current UTC date)
- CSV columns: _id, name, html_url, owner, created_at, updated_at_

```js
github-scripts -t <token> -u some-username --repos
```

or

```js
github-scripts -t <token> -o some-orgname --repos
```

### Get all `package.json` files under a user/org's repositories 

- Input: user/org, `output/repos-<user/org>-yyyy-mm-dd.csv` (current UTC date)
- Output: `output/pjson-<user/org>-yyyy-mm-dd.csv` (current UTC date)
- CSV columns: _name, owner, repo, path_

```js
github-scripts -t <token> -u some-username --pjson
```

or

```js
github-scripts -t <token> -u some-orgname --pjson
```

### Get specific version information about Node dependencies from `package.json` files for a user/org's repositories

- Input: user/org, `output/pjson-<user/org>-yyyy-mm-dd.csv` (current UTC date) + comma separated dependencies (see Options below)
- Output: `output/deps-<user/org>-yyyy-mm-dd.csv` (current UTC date)
- CSV columns: _repo, path, pkg1_version, pkg2_version, etc._

```js
github-scripts -t <token> -u some-username --deps react,styled-components
```

or 

```js
github-scripts -t <token> -o some-orgname --deps react,styled-components
```

### Get search results for a specific string in a user/org's repos

- Input: user/org, `output/repos-<user/org>-yyyy-mm-dd.csv` (current UTC date)
- Output: `output/search-results-<user/org>-yyyy-mm-dd.csv` (current UTC date)
- CSV columns: __search, repo, path, filename, score, url__

```js
github-scripts -t <token> -u some-username --search nextjs
```

or 

```js
github-scripts -t <token> -o some-orgname --search nextjs
```

### Get all issues in a specific user/org's repository

- Input: user/org, repo name
- Output: `output/issues-<user/org>-<repo>-yyyy-mm-dd.csv` (current UTC date)
- CSV columns: __html_url, title, body, author, comments__

```js
github-scripts -t <token> -u some-username --issues
```

or 

```js
github-scripts -t <token> -o some-orgname --issues
```

### Set up

* Create a Github API personal access token : https://github.com/settings/tokens
* Give the token the `repo` scope
* Copy the token and pass it when running the scripts using `-t` or `--token`, or set up a `GITHUB_TOKEN` environment variable

### Usage

```
npm install
npm link
github-scripts -t [token] <option>
```

or

```
node index.js -t [token] <option>
```

## Options

| Name                | Shortcut     | Description                                                                                                                                  |
| ------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------|
| `--token`           | `-t`         | pass Github token (required unless `GITHUB_TOKEN` is set)                                                                                    |
| `--user` or `--org` | `-u` or `-o` | pass Github username or org name (required), e.g. `--user ruxandrafed` or `--org github`                                                     |
| `--repos`           | `-r`         | get list of all current repositories for a user/org                                                                                          |
| `--issues`          | `-i`         | get all issues from a particular repo, e.g. `--issues some-repo-name`                                                                        |
| `--pjson`           | `-p`         | get list of all `package.json` files under a user/org's repositories                                                                         |
| `--deps`            | `-d`         | specify comma-separated package names to get info about the version used inside `package.json` files, e.g. `--deps react,styled-components`  |
| `--search`          | `-s`         | search for string across all repositories of a user/org, e.g. `--search nodejs`                                                              |

## Opportunities

- Write CSVs line-by-line vs. waiting for all the data and writing it all at once.