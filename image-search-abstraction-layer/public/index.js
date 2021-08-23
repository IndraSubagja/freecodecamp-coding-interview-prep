const urlElement = document.querySelector('.output > a');
const form = document.querySelector('form');

const urlProps = {
  origin: window.location.origin,
  type: 'recent',
  query: '',
  page: '1',
  size: 'all',
};

type.addEventListener('change', () => {
  if (type.value === 'recent') {
    query.disabled = true;
    page.disabled = true;
    size.disabled = true;
  } else {
    query.disabled = false;
    page.disabled = false;
    size.disabled = false;
  }

  urlProps.type = type.value;
  generateUrl();
});

query.addEventListener('change', () => {
  urlProps.query = query.value;
  generateUrl();
});

page.addEventListener('change', () => {
  urlProps.page = page.value;
  generateUrl();
});

size.addEventListener('change', () => {
  urlProps.size = size.value;
  generateUrl();
});

const generateUrl = () => {
  let url = `${urlProps.origin}/${urlProps.type}`;

  if (urlProps.type === 'query' && urlProps.query) {
    url += `/${urlProps.query}?page=${urlProps.page}`;
    url += urlProps.size !== 'all' ? `&size=${urlProps.size}` : '';
  } else if (urlProps.type === 'query' && !urlProps.query) {
    url = urlProps.origin;
  }

  urlElement.innerHTML = url;
  urlElement.setAttribute('href', url);
  urlElement.setAttribute('target', '_blank');
};

generateUrl();
