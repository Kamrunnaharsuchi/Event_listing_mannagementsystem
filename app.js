const BACKEND_API_URL = "http://localhost:3000/api";

$(document).ready(function () {
  var $grid;
  var lightGalleryInstance = null;

  $("#searchForm").on("submit", function (e) {
    e.preventDefault();
    const val = $("#searchInput").val();
    if (val) {
      window.location.href = `search.html?title=${val}`;
    }
  });
  // Delegate event handler for filter clicks
  $(document).on("click", "#gallery_content li", function () {
    var filterValue = $(this).attr("data-filter");
    $("#gallery_content li").removeClass("active");
    $(this).addClass("active");

    console.log("Filter value:", filterValue);

    // Apply isotope filter with a forced relayout
    $grid.isotope({
      filter: filterValue,
    });
  });
  function loadedGallery() {
    $.get(`${BACKEND_API_URL}/gallery`)
      .then((res) => {
        let li_data = `<li data-filter="*" class="active">All</li>`;
        let image_data = "";

        const uniqueCategories = new Set();

        if (res.length > 0) {
          res.forEach((gallery) => {
            uniqueCategories.add(gallery.categoryName);
          });

          uniqueCategories.forEach((category) => {
            li_data += `<li data-filter=".${category.replace(/\s+/g, '_')}">${category}</li>`;
          });

          const isIndexPage =
            window.location.pathname.endsWith("index.html") ||
            window.location.pathname.endsWith("/") ||
            window.location.pathname === "";

          const galleryItems = isIndexPage ? res.slice(0, 12) : res;

          galleryItems.forEach((gallery) => {
            image_data += `
            <div class="col-sm-6 col-md-4 col-lg-3 mb-4 grid-item ${gallery.categoryName.replace(/\s+/g, '_')}">
              <a href="${BACKEND_API_URL}/uploads/${gallery.image}" class="gripImg">
                <img class="gripImg_img" src="${BACKEND_API_URL}/uploads/${gallery.image}" alt="${gallery.imageTitle}" />
              </a>
            </div>`;
          });

          $("#gallery_content").html(li_data);
          $("#lightgallery").html(image_data);

          $grid = $(".grid").isotope({
            itemSelector: ".grid-item",
            percentPosition: true,
            layoutMode: "fitRows",
            fitRows: { gutter: 0 },
          });

          $grid.imagesLoaded().progress(function () {
            $grid.isotope("layout");
          });

          if (lightGalleryInstance) {
            lightGalleryInstance.destroy();
          }

          lightGalleryInstance = lightGallery(
            document.getElementById("lightgallery"),
            {
              selector: ".gripImg",
              plugins: [lgZoom, lgThumbnail],
              speed: 500,
              download: false,
              counter: true,
              thumbnail: true,
              animateThumb: true,
              zoomFromOrigin: true,
              allowMediaOverlap: true,
            }
          );
        }
      })
      .catch((error) => {
        console.error("Error loading gallery:", error);
      });
  }

  loadedGallery();

  function loadLastEvent() {
    $.get(`${BACKEND_API_URL}/category`)
      .then((res) => {
        console.log("🚀 ~ .then ~ res:", res);

        const data = res;

        let eventHtml = "";
        data.forEach((elem) => {
          eventHtml += `
              <div class="col-lg-4 mb-4">
  <div class="card_wrapper position-relative">
    <div class="img_wrapper overflow-hidden position-relative">
      <a href="category.html?id=${elem.id}">
        <img
          src="${BACKEND_API_URL}/uploads/${elem.img}"
          alt="Event image"
          class="img-fluid"
        />
      </a>
      <h4 class="image-title text-center m-0">
        <a
          href="category.html?id=${elem.id}"
          class="text-decoration-none text-white"
        >${elem.name}</a>
      </h4>
    </div>
  </div>
</div>
            `;
        });
        $(".fetch_lasted_event").html(eventHtml);
      })
      .catch((error) => {
        console.error("Error loading last event:", error);
      });
  }
  function loadUpcomingEvent() {
    $.get(`${BACKEND_API_URL}/events/type/Up Coming`)
      .then((res) => {
        if (res.success) {
          const data = res.data;
          let htmlFirst = `
            <div class="img_wrapper">
                <a href="single-event.html?id=${data[0].id}">
                  <img
                    src="${data[0].thumbnail}"
                    alt="Event image"
                    class="w-100"
                /></a>
              </div>
              <h2 class="title_text mt-4">
                <a href="single-event.html?id=${data[0].id}">${
            data[0].title
          }</a>
              </h2>
              <p>
                <a
                  href="category.html?id=${data[0].category}"
                  class="text-decoration-none cat_wrapper"
                  >${data[0].category_name}</a
                >
                <a
                  href="#"
                  class="text-decoration-none cat_wrapper"
                  >Date: ${data[0].date}</a
                >
              </p>
              <p class="mb-0 desc_text_first">
                ${findText(data[0], 2)}
              </p>
          `;
          $(".first_post_cat_wrapper").html(htmlFirst);
          let eventHtml = "";
          data.slice(1, 6).forEach((elem) => {
            eventHtml += `
            <div class="second_event_cat_wrapper mb-4">
                <img
                  src="${elem.thumbnail}"
                  alt="Event 1"
                />
                <div>
                  <div class="cat_wapper_event">
                    <a
                      href="category.html?id=${elem.category}"
                      class="text-decoration-none"
                      >${elem.category_name}</a
                    >
                  </div>
                  <div class="event_title_wrapper_cat">
                    <h4>
                      <a href="single-event.html?id=${elem.id}"
                        >${elem.title.substring(0, 24)}...</a
                      >
                    </h4>
                  </div>
                  <div class="event_date_wrapper_cat">
                    <p>Date: ${elem.date}</p>
                  </div>
                </div>
              </div>`;
          });
          $(".second_post_cat_wrapper").html(eventHtml);
        } else {
          console.log(res);
        }
      })
      .catch((error) => {
        console.error("Error loading last event:", error);
      });
  }
  loadLastEvent();
  loadUpcomingEvent();

  function loadSemiEvent() {
    $.get(
      `${BACKEND_API_URL}/events/events-by-category/eece81c9-f69a-4426-93e2-f3d024179e06`
    )
      .then((res) => {
        if (res.success) {
          const data = res.data;

          let eventHtml = "";
          data.slice(0, 4).forEach((elem) => {
            eventHtml += `
              <div class="row border-bottom py-4 align-items-center">
              <div class="col-lg-4 small_img_wrapper">
                <div class="img_wrapper overflow-hidden">
                  <a href="single-event.html?id=${elem.id}">
                    <img
                      src="${elem.thumbnail}"
                      alt="Event image"
                    />
                  </a>
                </div>
              </div>
              <div class="col-lg-8">
                <div class="third_cat_wrapper_desc ms-5">
                  <h2 class="title_text">
                    <a href="single-event.html?id=${elem.id}"
                      >${elem.title}</a
                    >
                  </h2>
                  <p>
                    <a
                      href="category.html?id=${elem.category}"
                      class="text-decoration-none cat_wrapper"
                      >${elem.category_name}</a
                    >
                    <a
                      href="#"
                      class="text-decoration-none cat_wrapper"
                      >Date: ${elem.date}</a
                    >
                  </p>
                  <p class="desc_text_first">
                    ${findText(elem, 2)}
                  </p>
                  <a
                    style="color: #6a1651"
                    href="single-event.html?id=${elem.id}"
                    class="text-decoration-none"
                  >
                    Read More
                    <i class="fa-solid fa-arrow-right"></i>
                  </a>
                </div>
              </div>
            </div>
            `;
          });
          $(".first_cat_event_wrapper").html(eventHtml);
        } else {
          console.log(res);
        }
      })
      .catch((error) => {
        console.error("Error loading last event:", error);
      });
  }
  function loadSecondEvent() {
    $.get(
      `${BACKEND_API_URL}/events/events-by-category/cab555cb-39b8-46fa-85b2-f51109ffd189`
    )
      .then((res) => {
        if (res.success) {
          const data = res.data;

          let eventHtml = "";
          data.slice(0, 6).forEach((elem) => {
            eventHtml += `
            <div class="col-lg-4 mb-4">
              <div class="card_wrapper position-relative">
                <div
                  class="category_type_text position-absolute top-0 start-0 bg-white px-3 py-1"
                >
                  ${elem.type}
                </div>
                <div class="img_wrapper overflow-hidden">
                  <a href="single-event.html?id=${elem.id}">
                    <img
                      src="${elem.thumbnail}"
                      alt="Event image"
                    />
                  </a>
                </div>
                <div class="card_desc p-4">
                  <p class="category_name_card">
                    <a
                      href="category.html?id=${elem.category}"
                      class="text-decoration-none"
                      >${elem.category_name}</a
                    >
                  </p>
                  <h4>
                    <a
                      href="single-event.html?id=${elem.id}"
                      class="text-decoration-none"
                      >${elem.title.substring(0, 24)} ...</a
                    >
                  </h4>
                  <p>
                    ${findText(elem, 1)}
                  </p>
                </div>
              </div>
            </div>
            `;
          });
          $(".second_cat_event_wrapper").html(eventHtml);
        } else {
          console.log(res);
        }
      })
      .catch((error) => {
        console.error("Error loading last event:", error);
      });
  }
  loadSecondEvent();
  loadSemiEvent();
  function loadCategory() {
    $.get(`${BACKEND_API_URL}/category`)
      .then((res) => {
        let eventHtml = "";
        res.forEach((elem) => {
          eventHtml += `<li><a href="category.html?id=${elem.id}">${elem.name}</a></li>`;
        });
        $(".dropdown_menu ul").html(eventHtml);
        $(".sidebar_cat_wrapper ul").html(eventHtml);
      })
      .catch((error) => {
        console.error("Error loading last event:", error);
      });
  }
  loadCategory();
  function findText(elem, type = 1) {
    let descriptionElement = document.createElement("div");
    descriptionElement.innerHTML = elem.description;
    let plainTextDescription =
      descriptionElement.textContent || descriptionElement.innerText || "";

    if (type == 1) {
      let shortDescription = plainTextDescription.trim().substring(0, 100);
      if (plainTextDescription.length > 100) {
        shortDescription += "...";
      }
      return shortDescription;
    } else if (type == 2) {
      let shortDescription = plainTextDescription.trim().substring(0, 300);
      if (plainTextDescription.length > 300) {
        shortDescription += "...";
      }
      return shortDescription;
    } else {
      let shortDescription = plainTextDescription.trim().substring(0, 20);
      if (plainTextDescription.length > 20) {
        shortDescription += "...";
      }
      return shortDescription;
    }
  }
  // Handle window resize for recalculation
  $(window).on("resize", function () {
    if ($grid) {
      $grid.isotope("layout");
    }
  });
});
