const axios = require('axios')
const access_token = process.env.TIMES

// For interfacing with the Strava API.
const Strava = axios.create({
  baseURL: 'https://www.strava.com/api/v3/',
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
})

const SGWeatherTemperature = axios.create({
  baseURL: 'https://api.data.gov.sg/v1/environment/air-temperature'
})

const SGWeatherRain = axios.create({
  baseURL: 'https://api.data.gov.sg/v1/environment/rainfall'
})

const SGWeatherHumidity = axios.create({
  baseURL: 'https://api.data.gov.sg/v1/environment/relative-humidity'
})

const SGWeatherWindDirection = axios.create({
  baseURL: 'https://api.data.gov.sg/v1/environment/wind-direction'
})

const SGWeatherWindSpeed = axios.create({
  baseURL: 'https://api.data.gov.sg/v1/environment/wind-speed'
})

// Draw ASCII arrow in the direction the wind is blowing.
const arrow = bearing => (
  '↓↙←↖↑↗→↘↓'[Math.round(bearing / 45)]
)

// Draw ASCII of rain density or a sun symbol
const density = bearing => (
  bearing == 0 ? '☀' : '☂ ' +'░▒▓█'[Math.round(bearing / 5)] +' '+ bearing
)

//https://unicode-table.com/en/2602/
// Generate stamp from weather conditions. Example output:
// 23.31 °C | 4.78 km/h (22.35 km/h gust) ↗
// U+1F4A7 - drop for humidity
const createStamp = ({ temperature, rain, humidity, windSpeed, windBearing }) => (
  [
    `🌡  ${temperature}°C`,
    `☵  ${humidity}%`,
    `🌬  ${windSpeed}km/h ${arrow(windBearing)} `,
    `${density(rain)}`
  ].join(' | ')
)

// Get the athlete's most recent activity.
const getLatestActivity = () => (
  Strava.get('athlete/activities', { params: { per_page: 1 }}).then(res => (
    res.data[0]
  ))
)

const findStationById = (obj, station_id) => {
  //FIXME: find a closest station
  const key = Object.keys(obj).find(station => obj[station].station_id === 'S107')
  return obj[key]
}

const getTemperature = loctime => (
  SGWeatherTemperature.get('', { params: { date_time: loctime }}).then(res => (
    res.data.items[0].readings
  ))
  .catch(function (error) {
    console.log(error);
  })
)

const getRain = loctime => (
  SGWeatherRain.get('', { params: { date_time: loctime }}).then(res => (
    res.data.items[0].readings
  ))
  .catch(function (error) {
    console.log(error);
  })
)

const getHumidity = loctime => (
  SGWeatherHumidity.get('', { params: { date_time: loctime }}).then(res => (
    res.data.items[0].readings
  ))
  .catch(function (error) {
    console.log(error);
  })
)

const getWindDirection = loctime => (
  SGWeatherWindDirection.get('', { params: { date_time: loctime }}).then(res => (
    res.data.items[0].readings
  ))
  .catch(function (error) {
    console.log(error);
  })
)

const getWindSpeed = loctime => (
  SGWeatherWindSpeed.get('', { params: { date_time: loctime }}).then(res => (
    res.data.items[0].readings
  ))
  .catch(function (error) {
    console.log(error);
  })
)

// Update the activity with a weather stamp
const stampActivity = async activity => {

  conditions = new Object()
  conditions.temperature=findStationById(await getTemperature(activity.start_date), 'S107').value
  conditions.rain=findStationById(await getRain(activity.start_date), 'S107').value
  conditions.humidity=findStationById(await getHumidity(activity.start_date), 'S107').value
  conditions.windSpeed=findStationById(await getWindSpeed(activity.start_date), 'S107').value
  conditions.windBearing=findStationById(await getWindDirection(activity.start_date), 'S107').value
  const description = createStamp(conditions)

  await Strava.put(`activities/${activity.id}`, { description })
  return description
}

// Weather stamp the athlete's latest activity
(async () => {
  try {

    const activity = await getLatestActivity()
    const stamp = await stampActivity(activity)

    console.log(activity.name)
    console.log(stamp)
  } catch(error) {
    console.error(error.response.data)
  }
})()
