module.exports = function (app) {
  app.get('/users', (req, res) => {
    res.sendFile(process.cwd() + '/views/users.html');
  });
  app.get('/profile', (req, res) => {
    res.sendFile(process.cwd() + '/views/profile.html');
  });
  app.get('/edit-profile', (req, res) => {
    res.sendFile(process.cwd() + '/views/edit-profile.html');
  });
  app.get('/users/:id', (req, res) => {
    res.sendFile(process.cwd() + '/views/profile.html');
  });
  app.get('/books', (req, res) => {
    res.sendFile(process.cwd() + '/views/books.html');
  });
  app.get('/books/:id', (req, res) => {
    res.sendFile(process.cwd() + '/views/books.html');
  });
  app.get('/books/select/give', (req, res) => {
    res.sendFile(process.cwd() + '/views/books-give.html');
  });
  app.get('/books/select/take', (req, res) => {
    res.sendFile(process.cwd() + '/views/books-take.html');
  });
  app.get('/login', (req, res) => {
    res.sendFile(process.cwd() + '/views/login.html');
  });
  app.get('/register', (req, res) => {
    res.sendFile(process.cwd() + '/views/register.html');
  });
  app.get('/my-books', (req, res) => {
    res.sendFile(process.cwd() + '/views/my-books.html');
  });
  app.get('/requests', (req, res) => {
    res.sendFile(process.cwd() + '/views/requests.html');
  });
  app.get('/requests/new', (req, res) => {
    res.sendFile(process.cwd() + '/views/new-request.html');
  });
  app.get('/requests/incoming', (req, res) => {
    res.sendFile(process.cwd() + '/views/incoming-requests.html');
  });
  app.get('/requests/select/:id', (req, res) => {
    res.sendFile(process.cwd() + `/views/select-books.html`);
  });
  app.get('/trades', (req, res) => {
    res.sendFile(process.cwd() + `/views/trades.html`);
  });
};
