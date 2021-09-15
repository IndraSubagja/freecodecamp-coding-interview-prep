const notification = document.querySelector('.notification');
const navUser = document.querySelector('.user');
const bookList = document.querySelector('.book-list');
const requestsLink = document.querySelector('a[href="/requests"]');
const loginOnlyBtn = document.querySelector('.flex-end');

const userId = localStorage.getItem('userId');
let request = JSON.parse(localStorage.getItem('request')) || [];
let user;

const loadHandler = async (callback) => {
  if (userId) {
    user = await fetch(`/api/user?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => data.user);

    requestsLink.outerHTML = `
      <div class="requests">
        <button type="button">Requests</button>
      </div>
      `;

    const navRequests = document.querySelector('.requests');

    const requestsDropdown = document.createElement('div');
    requestsDropdown.classList.add('dropdown', 'dropdown-requests');

    const requestsDropdownList = [
      ['requests', 'All Requests'],
      ['requests/new', 'Create Request'],
    ];

    if (user.incomingRequests.length) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.innerText = user.incomingRequests.length;

      navRequests.appendChild(badge);

      requestsDropdownList.push(['requests/incoming', 'Incoming Requests']);
    }

    requestsDropdownList.map((list) => {
      const link = document.createElement('a');
      link.setAttribute('href', `/${list[0]}`);
      link.innerText = list[1];

      if (list[1] === 'Incoming Requests') {
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.innerText = user.incomingRequests.length;

        link.appendChild(badge);
      }

      requestsDropdown.appendChild(link);
    });

    navRequests.appendChild(requestsDropdown);

    if (navUser) {
      navUser.innerHTML = `<button type="button">${user.username}</button>`;

      const userDropdown = document.createElement('div');
      userDropdown.classList.add('dropdown', 'dropdown-user');

      const userDropdownList = ['profile', 'edit-profile', 'my-books', 'logout'];
      userDropdownList.map((list) => {
        const link = document.createElement('a');

        if (list === 'logout') {
          link.addEventListener('click', () => {
            localStorage.clear();
            document.location.href = '/books';
          });
        } else {
          link.setAttribute('href', `/${list}`);
        }
        link.innerText = list.split('-').join(' ');

        userDropdown.appendChild(link);
      });

      navUser.appendChild(userDropdown);
    }
  } else {
    if (loginOnlyBtn) {
      loginOnlyBtn.innerHTML = '<a href="/login" class="btn">Login to Add Books and Submit Requests</a>';
    }
  }

  callback();
};

const showNotification = (data) => {
  notification.classList.add(data.success ? 'success' : 'danger');
  notification.classList.remove(data.success ? 'danger' : 'success');
  notification.innerText = data.message;
};

const addBook = (book, emptyMessage) => {
  const label = document.createElement('label');
  const checkbox = document.createElement('input');
  const div = document.createElement('div');
  const title = document.createElement('h2');
  const description = document.createElement('p');
  const details = document.createElement('small');

  if (book.requests.length) {
    const div = document.createElement('div');
    const badgeDiv = document.createElement('div');
    const usersDiv = document.createElement('div');

    div.classList.add('request-info');
    badgeDiv.classList.add('badge');
    badgeDiv.innerHTML = `<a href="/requests?bookId=${book._id}">Requests</a><span>${book.requests.length}</span>`;
    usersDiv.innerHTML = `(${book.requests.map(
      (request) => `<a href="/users/${request.user._id}">${request.user.username}</a>`
    )})`;

    div.appendChild(badgeDiv);
    div.appendChild(usersDiv);

    label.appendChild(div);
  }

  const userAddress =
    book.user.city && book.user.state
      ? `${book.user.city}, ${book.user.state}`
      : book.user.city || book.user.state || 'Somewhere amazing';

  label.setAttribute('for', book._id);
  checkbox.setAttribute('type', 'checkbox');
  checkbox.setAttribute('id', book._id);
  checkbox.setAttribute('name', book._id);
  checkbox.setAttribute('value', book._id);
  !!request.find((requestBook) => requestBook._id === book._id) && checkbox.setAttribute('checked', true);
  checkbox.addEventListener('change', (event) => {
    const existedBook = request.find((requestBook) => requestBook._id === book._id);

    if (event.target.checked && !existedBook) {
      request.push({ ...book, type: book.user._id === user?._id ? 'give' : 'take' });
    } else if (!event.target.checked) {
      request = request.filter((requestBook) => requestBook._id !== book._id);
    }

    localStorage.setItem('request', JSON.stringify(request));
  });
  title.innerText = `${book.title} - ${book.author}`;
  description.innerText = book.description || 'No description available for this book';
  details.innerHTML = `from <a href="/users/${book.user._id}">${book.user.username}</a> in ${userAddress}`;

  div.appendChild(title);
  div.appendChild(description);
  div.appendChild(details);

  label.appendChild(checkbox);
  label.appendChild(div);

  if (book.user._id === user?._id) {
    const button = document.createElement('button');
    button.classList.add('close');
    button.innerText = 'x';
    button.addEventListener('click', async (event) => {
      try {
        const data = await fetch('/api/book', {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bookId: book._id, userId: book.user._id }),
        }).then((res) => res.json());

        if (event.target.parentElement.parentElement.childNodes.length === 1) {
          const p = document.createElement('p');
          p.innerText = emptyMessage;

          bookList.appendChild(p);
        }

        event.target.parentElement.remove();
        showNotification(data, true);
      } catch (error) {
        showNotification(error, false);
      }
    });

    label.appendChild(button);
  }

  if (bookList.childNodes[0]?.nodeName === 'P') bookList.childNodes[0].remove();

  bookList.appendChild(label);
};

const getBooks = async (emptyMessage, userId = false, withoutUser = false) => {
  const data = await fetch(userId ? `/api/book?userId=${userId}` : '/api/book').then((res) => res.json());

  if (!data.books.length) {
    const p = document.createElement('p');
    p.innerText = emptyMessage;

    return bookList.appendChild(p);
  }

  if (withoutUser) {
    data.books.filter((book) => book.user._id !== user._id).map((book) => addBook(book, emptyMessage));
  } else {
    data.books.map((book) => addBook(book, emptyMessage));
  }
};

const addBookRequest = (element, book, withUser = false, withRequest = false, withCheckbox = false) => {
  const content = document.createElement(withCheckbox ? 'label' : 'li');
  const bookContent = document.createElement('div');
  const title = document.createElement('h3');
  const description = document.createElement('p');

  if (withCheckbox) {
    const checkbox = document.createElement('input');

    content.setAttribute('for', book._id);
    checkbox.setAttribute('type', 'checkbox');
    checkbox.setAttribute('id', book._id);
    checkbox.setAttribute('name', book._id);
    checkbox.setAttribute('value', book._id);
    checkbox.addEventListener('change', (event) => {
      let trade = JSON.parse(localStorage.getItem('trade'));
      const existedBook = trade.find((tradeBook) => tradeBook._id === book._id);

      if (event.target.checked && !existedBook) {
        trade.push({ ...book, type: book.user._id === user?._id ? 'take' : 'give' });
      } else if (!event.target.checked) {
        trade = trade.filter((tradeBook) => tradeBook._id !== book._id);
      }

      localStorage.setItem('trade', JSON.stringify(trade));
    });

    content.appendChild(checkbox);
  }

  if (withRequest && book.requests.length) {
    const div = document.createElement('div');
    div.classList.add('badge');
    div.innerHTML = `<a href="/requests?bookId=${book._id}">Requests</a><span>${book.requests.length}</span>`;

    content.appendChild(div);
  }

  title.innerHTML = `${book.title} - ${book.author}${
    withUser ? ` from <a href="/users/${book.user._id}">${book.user.username}</a>` : ''
  }`;
  description.innerText = book.description || 'No description available for this book';

  bookContent.appendChild(title);
  bookContent.appendChild(description);

  content.appendChild(bookContent);

  element.appendChild(content);
};
