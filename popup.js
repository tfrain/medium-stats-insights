'use strict';
// let articlesMeta;
document.querySelector('.version').innerHTML = 'v' + chrome.runtime.getManifest().version;

/** Nav Bar */

const nav_items = document.querySelectorAll('.nav_item');
nav_items.forEach((el) => el.addEventListener('click', handleChangeTab));

function handleChangeTab() {
  nav_items.forEach((el) => {
    if (el.dataset.name !== this.dataset.name) {
      el.classList.remove('nav_item-active');
      document.querySelector(`#${el.dataset.name}_container`).style.display = 'none';
    } else {
      el.classList.add('nav_item-active');
      document.querySelector(`#${el.dataset.name}_container`).style.display = 'flex';
    }
  });
}

function renderUserProfile({ name, username, imageId }, followerCount) {
  const avatarUrl = `${AVATAR_URL}${imageId}`;
  document.querySelector('.user_profile_wrap').innerHTML = `
        <div class="user_info_wrap">
          <a
            href="https://medium.com/@${username}"
            target="_blank"
            rel="noopener"
            title="Profile Page"
          >
            <div class="username">${name}</div>
          </a>
          ${followerCount !== -1
      ? ` <div class="followers">${followerCount.toLocaleString()} followers</div>`
      : ''
    }
        </div>
        <div class="avatar_wrap">
          <img
            class="avatar"
            src=${avatarUrl}
            alt="avatar"
           />
          <a
            href="https://medium.com/me/stats"
            target="_blank"
            rel="noopener"
            title="My stats"
            class="stats_icon"
          >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-bar-chart-2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>          </a>
        </div>
        `;
}

/** Summary Page */

let isReadyToRenderSummaryPage = false;
let storiesData;
let loadedArticles = 0;
let totalArticles;
let errorLog = { hasSummary: false, hasFollower: false };

(async () => {
  // 1. user info
  const userStatsRawResponse = await fetch(MEDIUM_SUMMARY_STATS_URL);
  const userStatsTextResponse = await userStatsRawResponse.text();
  const userData = parseMediumResponse(userStatsTextResponse);
  const users =
    (userData && userData.payload && userData.payload.references && userData.payload.references.User) || {};
  const { username, name, imageId, userId } = Object.values(users)[0] || {};
  const userMeta = { username, name, imageId, userId };
  totalArticles = (userData && userData.payload && userData.payload.userPostCounts && userData.payload.userPostCounts.approvedOrSubmittedPosts) || {};

  const socialStats =
    (userData && userData.payload && userData.payload.references && userData.payload.references.SocialStats) || {};
  const usersFollowedByCount = Object.values(socialStats)[0].usersFollowedByCount;
  errorLog.hasFollower = true;

  // 2. story info
  const storyData = await handleUserLifetimeStoryStatsPostsQueryFirst(username)
  const storyRawData = (storyData && storyData.user && storyData.user.postsConnection && storyData.user.postsConnection.edges) || {};

  let postsConnection = storyData.user.postsConnection;
  while (
    postsConnection &&
    postsConnection.pageInfo &&
    postsConnection.pageInfo.hasNextPage
  ) {
    var endCursorObj = JSON.parse(postsConnection.pageInfo.endCursor);
    const nextStoryRawResponse = await handleUserLifetimeStoryStatsPostsQuery(username, userId, endCursorObj.firstPublishedAt.N, endCursorObj.postId.S);

    const nextStoryRawData = nextStoryRawResponse && nextStoryRawResponse.user && nextStoryRawResponse.user.postsConnection && nextStoryRawResponse.user.postsConnection.edges;
    storyRawData.push(...nextStoryRawData);

    postsConnection = nextStoryRawResponse.user.postsConnection;
    articleLoaded()
  }

  const storyTableData = {
    totalViews: getTotal(storyRawData, 'views'),
    totalReads: getTotal(storyRawData, 'reads'),
    totalEarnings: getTotal(storyRawData, 'earnings'),
    totalStories: storyRawData.length,
  };
  function getTotal(arr, action) {
    return arr.reduce((sum, el) => {
      if (action == 'views' || action == 'reads') {
        return sum + el.node.totalStats[action];
      }
      return sum + el.node.earnings.total.units + el.node.earnings.total.nanos / 1e9;
    }, 0);
  }
  console.log(storyTableData)

  let storyRawDatas = storyRawData.slice();
  storiesData = storyRawDatas.map(item => item.node)

  errorLog.hasSummary = true;
  errorLog.name = username;
  errorLog.view = storyTableData.totalViews;
  errorLog.stories = storyTableData.totalStories;

  renderUserProfile(userMeta, usersFollowedByCount);
  renderSummaryData({ usersFollowedByCount, ...storyTableData });
  renderStoryData();

  function renderStoryData() {
    renderStoriesHandler('views');
  }

  function renderSummaryData({
    usersFollowedByCount,
    totalViews,
    totalReads,
    totalEarnings,
    totalStories,
  }) {
    document.querySelector('.total_views').innerHTML = totalViews.toLocaleString();
    if (usersFollowedByCount && usersFollowedByCount !== -1)
      document.querySelector('.total_followers').innerHTML = usersFollowedByCount.toLocaleString();
    else document.querySelector('#follower_count').remove();

    const html = `<table>
                      <thead>
                        <tr>
                          <th></th>
                          <th>Fans</th>
                          <th>Views</th>
                          <th>Reads</th>
                          <th>R/V</th>
                          <th>Stories</th>
                          <th>Earnings</th>
                          <th>E/S</th>
                        </tr>
                      <thead>
                      <tbody>
                        <tr>
                          <td>Total</td>
                          <td>${numFormater(usersFollowedByCount)}</td>
                          <td>${numFormater(totalViews)}</td>
                          <td>${numFormater(totalReads)}</td>
                          <td>${toPercentage(totalReads, totalViews)}</td>
                          <td>${numFormater(totalStories)}</td>
                          <td>$${numFormater(totalEarnings).toFixed(1)}</td>
                          <td>$${numFormater((totalEarnings / totalStories).toFixed(1))}</td>
                        </tr>
                      </tbody>
                    <table/>
                  `;

    document.querySelector('.summary_table').innerHTML = html;
    if (isReadyToRenderSummaryPage) {
      document.querySelector('#progress-bar').style.display = 'none';
      document.querySelector('.summary_wrap').style.display = 'flex';
    } else {
      isReadyToRenderSummaryPage = true;
    }
  }
})().catch((err) => {
  console.error(errorLog);
  console.error(err);
});

/** Views Page */

const fetchReadyState = Array(NUMBER_OF_MONTH_FETCHED).fill(false);
const hourViews = [];
const monthViews = [...Array(NUMBER_OF_MONTH_FETCHED / 12 + 1)].map(() =>
  [...Array(12)].map(() => 0)
);
const sumByHour = [...Array(24)].fill(0);
const sumByDay = [...Array(7)].fill(0);

let timeFormatState = 'day';
let fromTimeState = 0;
let isFinishFetch = false;
let zeroViewCounter = 0;
let alignHourOffset = 0;

const timeFormatBtnWrap = document.querySelector('.time_format_btn_wrap');
timeFormatBtnWrap.addEventListener('click', function (e) {
  if (e.target.classList.contains('format_btn-select')) return;
  for (let child of this.children) {
    if (child !== e.target) {
      child.classList.remove('format_btn-select');
    } else {
      child.classList.add('format_btn-select');
    }
  }
  changeTimeFormatState(e.target.dataset.timeformat); // data-timeformat
});

function changeTimeFormatState(newTimeFormat) {
  timeFormatState = newTimeFormat;
  if (hourViews[fromTimeState] !== undefined) {
    backwardTimeBtn.classList.remove('change_time_btn-prohibit');
  }
  renderHandler[timeFormatState](fromTimeState);
}

const forwardTimeBtn = document.querySelector('.forward_time_btn');
forwardTimeBtn.addEventListener('click', forwardTimeHandler);

const backwardTimeBtn = document.querySelector('.backward_time_btn');
backwardTimeBtn.addEventListener('click', backwardTimeHandler);

function forwardTimeHandler() {
  if (
    this.classList.contains('change_time_btn-prohibit') &&
    hourViews[fromTimeState] === undefined
  ) {
    return;
  }

  if (timeFormatState === 'hour') {
    fromTimeState -= 24;
  } else if (timeFormatState === 'day') {
    fromTimeState -= 24 * 7;
  } else if (timeFormatState === 'week') {
    fromTimeState -= 24 * 7 * 8;
  } else if (timeFormatState === 'month') {
    fromTimeState -= 24 * 30 * 6;
  } else if (timeFormatState === 'year') {
    fromTimeState -= 24 * 30 * 12;
  }
  if (fromTimeState <= 0) {
    fromTimeState = 0;
    forwardTimeBtn.classList.add('change_time_btn-prohibit');
  }
  if (hourViews[fromTimeState] !== undefined) {
    backwardTimeBtn.classList.remove('change_time_btn-prohibit');
  }
  renderHandler[timeFormatState](fromTimeState);
}

function backwardTimeHandler() {
  if (this.classList.contains('change_time_btn-prohibit')) return;
  let oldFromTimeState = fromTimeState;

  if (timeFormatState === 'hour') {
    fromTimeState += 24;
  } else if (timeFormatState === 'day') {
    fromTimeState += 24 * 7;
  } else if (timeFormatState === 'week') {
    fromTimeState += 24 * 7 * 8;
  } else if (timeFormatState === 'month') {
    fromTimeState += 24 * 30 * 6;
  } else if (timeFormatState === 'year') {
    fromTimeState += 24 * 30 * 12;
  }
  if (fromTimeState > 0 && forwardTimeBtn.classList.contains('change_time_btn-prohibit')) {
    forwardTimeBtn.classList.remove('change_time_btn-prohibit');
  }
  if (hourViews[fromTimeState] === undefined && hourViews[oldFromTimeState + 1] !== undefined) {
    backwardTimeBtn.classList.add('change_time_btn-prohibit');
    fromTimeState = hourViews.length - 1;
  }
  renderHandler[timeFormatState](fromTimeState);
}

displayViewsPage();
const renderHandler = {
  hour: (hourIdx) => {
    let labels = [];
    let data = [];
    for (let idx = 0; idx < 24; idx++) {
      if (hourViews[hourIdx + idx] === undefined) {
        backwardTimeBtn.classList.add('change_time_btn-prohibit');
        break;
      }
      let [timeStamp, views] = hourViews[hourIdx + idx];
      let label = `${23 - idx}:00 - ${23 - idx + 1}:00 (${timeStamp.getMonth() + 1
        }/${timeStamp.getDate()})`;
      labels.push(label);
      data.push(views);
    }
    if (hourViews[fromTimeState])
      renderViewsChart(labels.reverse(), data.reverse(), hourViews[fromTimeState][0]);
  },
  day: (hourIdx) => {
    let labels = [];
    let data = [];
    for (let idx = 0; idx < 24 * 7; idx++) {
      if (hourViews[hourIdx + idx] === undefined) {
        backwardTimeBtn.classList.add('change_time_btn-prohibit');
        break;
      }
      let [timeStamp, views] = hourViews[hourIdx + idx];
      if (idx % 24 === 0) {
        let label = `${timeStamp.getMonth() + 1}/${timeStamp.getDate()}`;
        labels.push(label);
        data.push(0);
      }
      data[data.length - 1] += views;
    }
    if (hourViews[fromTimeState])
      renderViewsChart(labels.reverse(), data.reverse(), hourViews[fromTimeState][0]);
  },
  week: (hourIdx) => {
    let labels = [];
    let data = [];
    for (let idx = 0; idx < 24 * 7 * 8; idx++) {
      if (hourViews[hourIdx + idx] === undefined) {
        backwardTimeBtn.classList.add('change_time_btn-prohibit');
        break;
      }
      let [timeStamp, views] = hourViews[hourIdx + idx];
      if (idx % (24 * 7) === 0) {
        let label =
          `${timeStamp.addTime('Date', -6).getMonth() + 1}/${timeStamp
            .addTime('Date', -6)
            .getDate()}` +
          ` - ` +
          `${timeStamp.getMonth() + 1}/${timeStamp.getDate()}`;

        labels.push(label);
        data.push(0);
      }
      data[data.length - 1] += views;
    }
    if (hourViews[fromTimeState])
      renderViewsChart(labels.reverse(), data.reverse(), hourViews[fromTimeState][0]);
  },
  month: (hourIdx) => {
    let labels = [];
    let data = [];
    let curTime = hourViews[hourIdx][0];

    for (let idx = 0; idx < 6; idx++) {
      let label = `${curTime}`.split(' ')[1];
      labels.push(label);
      data.push(monthViews[NOW.year - curTime.getFullYear()][curTime.getMonth()]);
      curTime = curTime.addTime('Month', -1);
    }

    renderViewsChart(labels.reverse(), data.reverse(), hourViews[fromTimeState][0]);
  },
  year: (hourIdx) => {
    let labels = [];
    let data = [];
    let curTime = hourViews[hourIdx][0];
    for (let idx = 0; idx < 3; idx++) {
      let label = `${curTime}`.split(' ')[3];
      labels.push(label);
      data.push(monthViews[NOW.year - curTime.getFullYear()].reduce((acc, cur) => acc + cur));
      curTime = curTime.addTime('FullYear', -1);
    }
    if (hourViews[fromTimeState])
      renderViewsChart(labels.reverse(), data.reverse(), hourViews[fromTimeState][0]);
  },
};
const viewsCtx = document.getElementById('viewsChart').getContext('2d');
let viewsChart;

function renderViewsChart(labels, data, timeStamp) {
  document.getElementById('viewsChart').style.display = 'block';
  document.querySelector('#views_loader').style.display = 'none';
  if (viewsChart) {
    viewsChart.data.datasets[0].data = data;
    viewsChart.data.labels = labels;
    viewsChart.options.title.text = timeStamp.getFullYear();
    viewsChart.update();
    return;
  }
  viewsChart = new Chart(viewsCtx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Views',
          borderColor: '#6e72b7',
          backgroundColor: 'rgba(80, 141, 162, 0.9)',
          data: data,
        },
      ],
    },

    options: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: timeStamp.getFullYear(),
        position: 'bottom',
      },
      tooltips: {
        displayColors: false,
        callbacks: {
          title: (tooltipItem, data) => data.labels[tooltipItem[0].index],
          label: (tooltipItem, data) =>
            'Views: ' + data.datasets[0].data[tooltipItem.index].toLocaleString(),
        },
      },

      scales: {
        xAxes: [
          {
            ticks: {
              callback: (t) => t.split(' - ')[0],
            },
          },
        ],
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
              callback: (value) => value.toLocaleString(),
            },
          },
        ],
      },
    },
  });
}

function displayViewsPage() {
  fetchStoriesStatsByMonth(NOW.epoch, 0);
  let lastTimeStamp;
  function fetchStoriesStatsByMonth(fromTime, monthIdx) {
    if (zeroViewCounter > 3 || monthIdx === NUMBER_OF_MONTH_FETCHED - 1) {
      isFinishFetch = true;
      // handleViewsDownload();
      if (hourViews.length - alignHourOffset < 24 * 30) {
        renderViewsMetrics();
      }
      return;
    }

    const year = fromTime.getFullYear();
    const month = fromTime.getMonth();
    const date = fromTime.getDate();
    const toTime = new Date(year, month - 1, date);

    fetch(MEDIUM_HOURLY_STATS_URL(toTime, fromTime))
      .then((response) => response.text())
      .then((response) => {
        const data = parseMediumResponse(response);

        const { value: rawData } = data.payload;
        let isZeroView = true;

        console.log(rawData.length)
        console.log(rawData)
        for (let idx = rawData.length - 1; idx >= 0; idx--) {
          let hourlyData = rawData[idx];
          if (hourlyData.views > 0 && isZeroView) isZeroView = false;
          let timeStamp = new Date(hourlyData.timestampMs);

          // Fill the gap btw two timestamps to ensure data continuity
          while (lastTimeStamp && getHourDiff(timeStamp, lastTimeStamp) > 1) {
            lastTimeStamp = lastTimeStamp.addTime('Hours', -1);
            hourViews.push([lastTimeStamp, 0]);
            if (hourViews.length - alignHourOffset === 24 * 30) {
              renderViewsMetrics();
            }
          }

          hourViews.push([timeStamp, hourlyData.views]);

          // Align the hourly data of the latest day to have 24 hours
          if (hourViews.length === 1) {
            while (hourViews[hourViews.length - 1][0].getHours() !== 23) {
              hourViews.push([hourViews[hourViews.length - 1][0].addTime('Hours', 1), 0]);
              alignHourOffset++;
            }
            hourViews.reverse();
          }
          if (hourViews.length - alignHourOffset === 24 * 30) {
            renderViewsMetrics();
          }

          sumByHour[timeStamp.getHours()] += hourlyData.views;
          sumByDay[timeStamp.getDay()] += hourlyData.views;
          monthViews[NOW.year - timeStamp.getFullYear()][timeStamp.getMonth()] += hourlyData.views;
          lastTimeStamp = timeStamp;
        }

        if (isZeroView) zeroViewCounter++;

        if (!fetchReadyState[monthIdx]) {
          fetchReadyState[monthIdx] = true;
          if (monthIdx === 0) renderHandler['day'](0);
        }

        fetchStoriesStatsByMonth(toTime, monthIdx + 1);
      })
      .catch(function (err) {
        console.error(err);
      });
  }
}

const renderViewsMetrics = () => {
  let daySum = 0;
  let weekSum = 0;
  let monthSum = 0;
  for (let idx = 0; idx < 24 * 30; idx++) {
    if (alignHourOffset + idx >= hourViews.length) {
      if (alignHourOffset + idx < 24) daySum = monthSum;
      if (alignHourOffset + idx < 24 * 7) weekSum = monthSum;
      break;
    }
    monthSum += hourViews[alignHourOffset + idx][1];
    if (idx === 24) daySum = monthSum;
    if (idx === 24 * 7) weekSum = monthSum;
  }
  document.querySelector('.day_views').innerHTML = numFormater(daySum);
  document.querySelector('.week_views').innerHTML = numFormater(weekSum);
  document.querySelector('.month_views').innerHTML = numFormater(monthSum);
  if (isReadyToRenderSummaryPage) {
    // document.querySelector('#summary_loader').style.display = 'none';
    document.querySelector('#progress-bar').style.display = 'none';
    document.querySelector('.summary_wrap').style.display = 'flex';
  } else {
    isReadyToRenderSummaryPage = true;
  }
};

const views_download = document.querySelector('.views_download');
const views_download_loader = document.querySelector('.views_download_loader');
const views_download_wrap = document.querySelector('.views_download_wrap');

function handleViewsDownload() {
  exportViewsToCsv();
  views_download.style.display = 'block';
  views_download_loader.style.display = 'none';
}

function exportViewsToCsv() {
  let csvArray = [['Year', 'Month', 'Day', 'Views']];
  let curDateViews = 0;
  let curDateKey = getDateKeyFromEpoch(new Date(hourViews[0]));
  for (let idx = 0; idx < hourViews.length; idx++) {
    const [timestamp, views] = hourViews[idx];
    const tmpDateKey = getDateKeyFromEpoch(new Date(timestamp));
    if (curDateKey !== tmpDateKey) {
      csvArray.push([
        `${curDateKey}`.slice(0, 4),
        `${curDateKey}`.slice(4, 6),
        `${curDateKey}`.slice(6, 8),
        curDateViews,
      ]);
      curDateViews = 0;
      curDateKey = tmpDateKey;
    }
    curDateViews += views;
  }
  const csvString = getCsvString(csvArray);
  views_download_wrap.setAttribute(
    'href',
    'data:text/csv;charset=utf-8,' + encodeURIComponent(csvString)
  );
  views_download_wrap.setAttribute(
    'download',
    `Medium-Stats-Counter-Views-${getDateKeyFromEpoch(NOW.epoch)}.csv`
  );
  views_download_wrap.addEventListener('click', () => {
  });
}

function updateProgressBar() {
  let percentage = (loadedArticles / totalArticles) * 100;

  let progressBar = document.getElementById('progress');
  progressBar.style.width = percentage + '%';
  progressBar.innerHTML = `${loadedArticles}/${totalArticles}`;

  let storiesProgressBar = document.getElementById('stories-progress');
  storiesProgressBar.style.width = percentage + '%';
  storiesProgressBar.innerHTML = `${loadedArticles}/${totalArticles}`;
}

function articleLoaded() {
  loadedArticles += 10;
  updateProgressBar();
}