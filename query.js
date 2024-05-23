async function handlePostCountsQuery() {
  const res = await fetch(MEDIUM_GRAPHQL_URL, {
    headers: {
      'Accept': '*/*',
      'Content-Type': 'application/json'
    },
    method: "POST",
    body: JSON.stringify([{
      operationName: "PostCountsQuery",
      variables: {},
      query: getPostCountsQuery()
    }])
  });
  const text = await res.text();
  return JSON.parse(text)[0].data;
}

function getPostCountsQuery() {
  return "query PostCountsQuery {\n  viewer {\n    id\n    userPostCounts(includeResponsesCount: true) {\n      ...YourStoriesNav_postCounts\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment YourStoriesNav_postCounts on UserPostCounts {\n  draftPosts\n  publishedRootPosts\n  responsePosts\n  unlistedPosts\n  deletedPosts\n  __typename\n}\n";
}

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
          lifetimeEarnings: "DESC"
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
  return "query UserLifetimeStoryStatsPostsQuery($username: ID\u0021, $first: Int\u0021, $after: String\u0021, $orderBy: UserPostsOrderBy, $filter: UserPostsFilter) {\n  user(username: $username) {\n    id\n    postsConnection(\n      first: $first\n      after: $after\n      orderBy: $orderBy\n      filter: $filter\n    ) {\n      __typename\n      edges {\n        ...LifetimeStoryStats_relayPostEdge\n        __typename\n      }\n      pageInfo {\n        endCursor\n        hasNextPage\n        __typename\n      }\n    }\n    __typename\n  }\n}\n\nfragment LifetimeStoryStats_relayPostEdge on RelayPostEdge {\n  node {\n    ...LifetimeStoryStats_post\n    __typename\n    id\n  }\n  __typename\n}\n\nfragment LifetimeStoryStats_post on Post {\n  id\n  ...StoryStatsTable_post\n  ...MobileStoryStatsTable_post\n  __typename\n}\n\nfragment StoryStatsTable_post on Post {\n  ...StoryStatsTableRow_post\n  __typename\n  id\n}\n\nfragment StoryStatsTableRow_post on Post {\n  id\n  ...TablePostInfos_post\n  firstPublishedAt\n  firstBoostedAt\n  isLocked\n  totalStats {\n    views\n    reads\n    __typename\n  }\n  earnings {\n    total {\n      currencyCode\n      nanos\n      units\n      __typename\n    }\n    __typename\n  }\n  ...usePostStatsUrl_post\n  __typename\n}\n\nfragment TablePostInfos_post on Post {\n  id\n  title\n  firstPublishedAt\n  readingTime\n  isLocked\n  visibility\n  ...usePostUrl_post\n  ...Star_post\n  __typename\n}\n\nfragment usePostUrl_post on Post {\n  id\n  creator {\n    ...userUrl_user\n    __typename\n    id\n  }\n  collection {\n    id\n    domain\n    slug\n    __typename\n  }\n  isSeries\n  mediumUrl\n  sequence {\n    slug\n    __typename\n  }\n  uniqueSlug\n  __typename\n}\n\nfragment userUrl_user on User {\n  __typename\n  id\n  customDomainState {\n    live {\n      domain\n      __typename\n    }\n    __typename\n  }\n  hasSubdomain\n  username\n}\n\nfragment Star_post on Post {\n  id\n  creator {\n    id\n    __typename\n  }\n  __typename\n}\n\nfragment usePostStatsUrl_post on Post {\n  id\n  creator {\n    id\n    username\n    __typename\n  }\n  __typename\n}\n\nfragment MobileStoryStatsTable_post on Post {\n  id\n  ...TablePostInfos_post\n  firstPublishedAt\n  firstBoostedAt\n  isLocked\n  totalStats {\n    reads\n    views\n    __typename\n  }\n  earnings {\n    total {\n      currencyCode\n      nanos\n      units\n      __typename\n    }\n    __typename\n  }\n  ...usePostStatsUrl_post\n  __typename\n}\n";
}

async function handleStatsPostReferrersQuery(postId) {
  const res = await fetch(MEDIUM_GRAPHQL_URL, {
    headers: {
      'Accept': '*/*',
      'Content-Type': 'application/json'
    },
    method: "POST",
    body: JSON.stringify([{
      operationName: "StatsPostReferrersContainerQuery",
      variables: {
        postId: postId
      },
      query: getStatsPostReferrersQuery()
    }])
  });
  const text = await res.text();
  return JSON.parse(text)[0].data;
}

function getStatsPostReferrersQuery() {
  return "query StatsPostReferrersContainerQuery($postId: ID\u0021) {\n  post(id: $postId) {\n    id\n    title\n    referrers {\n      ...StatsPostReferrersContainer_referrer\n      __typename\n    }\n    totalStats {\n      views\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment StatsPostReferrersContainer_referrer on Referrer {\n  totalCount\n  type\n  ...StatsPostReferrersExternalList_referrer\n  __typename\n}\n\nfragment StatsPostReferrersExternalList_referrer on Referrer {\n  totalCount\n  ...StatsPostReferrersExternalRow_referrer\n  __typename\n}\n\nfragment StatsPostReferrersExternalRow_referrer on Referrer {\n  totalCount\n  postId\n  type\n  sourceIdentifier\n  platform\n  internal {\n    postId\n    collectionId\n    profileId\n    type\n    __typename\n  }\n  search {\n    domain\n    keywords\n    __typename\n  }\n  site {\n    href\n    title\n    __typename\n  }\n  __typename\n}\n";
}