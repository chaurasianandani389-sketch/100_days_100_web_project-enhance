const options = {
  method: "GET",
  headers: {
    "X-RapidAPI-Key": "2c06e2f780msh3f81c0245629ba6p19a960jsn5eff9cb95a57",
    "X-RapidAPI-Host": "weather-by-api-ninjas.p.rapidapi.com",
  },
};
const getWeather = (city) => {
  cityName.innerHTML = city;

  fetch(
    "https://weather-by-api-ninjas.p.rapidapi.com/v1/weather?city=" + city,
    options,
  )
    .then((response) => response.json())

    .then((response) => {
      console.log(response);

      if (response.error || response.temp === undefined) {
        document.getElementById("error-message").innerHTML =
          "Weather data unavailable right now.";
        return;
      }

      document.getElementById("error-message").innerHTML = "";

      temp.innerHTML = response.temp;
      temp2.innerHTML = response.temp;

      feels_like.innerHTML = response.feels_like;

      humidity.innerHTML = response.humidity;
      humidity2.innerHTML = response.humidity;

      min_temp.innerHTML = response.min_temp;
      max_temp.innerHTML = response.max_temp;

      wind_speed.innerHTML = response.wind_speed;
      wind_speed2.innerHTML = response.wind_speed;

      wind_degrees.innerHTML = response.wind_degrees;

      sunrise.innerHTML = new Date(
        response.sunrise * 1000,
      ).toLocaleTimeString();

      sunset.innerHTML = new Date(response.sunset * 1000).toLocaleTimeString();
    })

    .catch((err) => {
      console.error(err);
      alert("Something went wrong while fetching weather data.");
    });
};

submit.addEventListener("click", (e) => {
  e.preventDefault();

  if (city.value.trim() === "") {
    alert("Please enter a city name");
    return;
  }

  getWeather(city.value);
});

const topBtn = document.getElementById("topBtn");

window.onscroll = function () {
  if (
    document.body.scrollTop > 200 ||
    document.documentElement.scrollTop > 200
  ) {
    topBtn.style.display = "block";
  } else {
    topBtn.style.display = "none";
  }
};

topBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});
