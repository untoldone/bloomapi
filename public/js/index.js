$(function () {
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
