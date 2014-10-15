$(function () {
  // Routing for legacy hash-based urls for NPI search and display
  if (window.location.hash && window.location.pathname == '/search') {
    var matches;
    if (matches = window.location.hash.match(/#\/([^\/]+)?\/?(\d+)?/)) {
      // Search Results
      if (matches[2]) {
        if (matches[1] == 'npis') {
          window.location = '/npis/' + matches[2];
        } else {
          window.location = '/search/' + matches[1] + '/' + matches[2];
        }
      } else if (matches[1]) {
        window.location = '/search/' + matches[1];
      } else {
        window.location = '/search';
      }
    } else if (matches = window.location.hash.match(/#\/npis\/(\d+)?/)) {
      // Specific NPI
      window.location = '/npis/' + matches[1];
    }
  }

  // Handle searches (click search or press enter with search focused)
  function handleSearch (e) {
    var query = $('#query').val();

    e.preventDefault();

    window.location = '/search/' + encodeURIComponent(query);
  };
  
  $('#search').click(handleSearch);
  $('#query').keypress(function (e) {
    if (e.keyCode == 13) {
      handleSearch(e);
    }
  });
});
