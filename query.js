async function handleUserLifetimeStoryStatsPostsQueryFirst(username) {
  const res = await fetch(MEDIUM_GRAPHQL_URL, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    method: "POST",
    body: JSON.stringify([{
      operationName: "UserLifetimeStoryStatsPostsQuery",
      variables: {
        username: username,
        first: 10,
        after: "",
        orderBy: {
          publishedAt: "DESC"
        },
        filter: {
          published: true
        }
      },
      query: getUserLifetimeStoryStatsPostsQuery()
    }])
  });
  const text = await res.text();
  return JSON.parse(text)[0].data;
}

async function handleUserLifetimeStoryStatsPostsQuery(username, userId, storyTime, postId) {
  let obj = {
    column: { S: "@" },
    creator: { S: userId },
    firstPublishedAt: { N: storyTime },
    postId: { S: postId }
  };
  let str = JSON.stringify(obj);
  const res = await fetch(MEDIUM_GRAPHQL_URL, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    method: "POST",
    body: JSON.stringify([{
      operationName: "UserLifetimeStoryStatsPostsQuery",
      variables: {
        username: username,
        first: 10,
        after: str,
        orderBy: {
          publishedAt: "DESC"
        },
        filter: {
          published: true
        }
      },
      query: getUserLifetimeStoryStatsPostsQuery()
    }])
  });
  const text = await res.text();
  return JSON.parse(text)[0].data;
}

function getUserLifetimeStoryStatsPostsQuery() {
  return "query UserLifetimeStoryStatsPostsQuery($username: ID\u0021, $first: Int\u0021, $after: String\u0021, $orderBy: UserPostsOrderBy, $filter: UserPostsFilter) {\n  user(username: $username) {\n    id\n    postsConnection(\n      first: $first\n      after: $after\n      orderBy: $orderBy\n      filter: $filter\n    ) {\n      __typename\n      edges {\n        ...LifetimeStoryStats_relayPostEdge\n        __typename\n      }\n      pageInfo {\n        endCursor\n        hasNextPage\n        __typename\n      }\n    }\n    __typename\n  }\n}\n\nfragment LifetimeStoryStats_relayPostEdge on RelayPostEdge {\n  node {\n    ...LifetimeStoryStats_post\n    __typename\n    id\n  }\n  __typename\n}\n\nfragment LifetimeStoryStats_post on Post {\n  id\n  ...StoryStatsTable_post\n  ...MobileStoryStatsTable_post\n  __typename\n}\n\nfragment StoryStatsTable_post on Post {\n  ...StoryStatsTableRow_post\n  __typename\n  id\n}\n\nfragment StoryStatsTableRow_post on Post {\n  id\n  ...TablePostInfos_post\n  firstPublishedAt\n  milestones {\n    boostedAt\n    __typename\n  }\n  isLocked\n  totalStats {\n    views\n    reads\n    __typename\n  }\n  earnings {\n    total {\n      currencyCode\n      nanos\n      units\n      __typename\n    }\n    __typename\n  }\n  ...usePostStatsUrl_post\n  __typename\n}\n\nfragment TablePostInfos_post on Post {\n  id\n  title\n  firstPublishedAt\n  readingTime\n  isLocked\n  visibility\n  ...usePostUrl_post\n  ...Star_post\n  __typename\n}\n\nfragment usePostUrl_post on Post {\n  id\n  creator {\n    ...userUrl_user\n    __typename\n    id\n  }\n  collection {\n    id\n    domain\n    slug\n    __typename\n  }\n  isSeries\n  mediumUrl\n  sequence {\n    slug\n    __typename\n  }\n  uniqueSlug\n  __typename\n}\n\nfragment userUrl_user on User {\n  __typename\n  id\n  customDomainState {\n    live {\n      domain\n      __typename\n    }\n    __typename\n  }\n  hasSubdomain\n  username\n}\n\nfragment Star_post on Post {\n  id\n  creator {\n    id\n    __typename\n  }\n  __typename\n}\n\nfragment usePostStatsUrl_post on Post {\n  id\n  creator {\n    id\n    username\n    __typename\n  }\n  __typename\n}\n\nfragment MobileStoryStatsTable_post on Post {\n  id\n  ...TablePostInfos_post\n  firstPublishedAt\n  milestones {\n    boostedAt\n    __typename\n  }\n  isLocked\n  totalStats {\n    reads\n    views\n    __typename\n  }\n  earnings {\n    total {\n      currencyCode\n      nanos\n      units\n      __typename\n    }\n    __typename\n  }\n  ...usePostStatsUrl_post\n  __typename\n}\n";
}