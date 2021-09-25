const { useEffect, useState } = React;
const { useRouteMatch } = window.ReactRouterDOM;

export default function Polls() {
  const [polls, setPolls] = useState(null);

  const match = useRouteMatch('/share/:pollId');

  useEffect(() => {
    const getPolls = async () => {
      try {
        const { data } = await axios.get(
          '/api/poll',
          match && match.params.pollId ? { params: { pollId: match.params.pollId } } : {}
        );
        setPolls(data);
      } catch (error) {
        console.log(error);
      }
    };

    if (!polls) {
      getPolls();
    }
  }, [polls]);

  return (
    polls && (
      <React.Fragment>
        <h1>All Polls</h1>
        <ul className="polls">
          {polls.length ? polls.map((poll) => <Poll poll={poll} />) : <p>There are no polls currently</p>}
        </ul>
      </React.Fragment>
    )
  );
}

function Poll({ poll }) {
  const [value, setValue] = useState('');
  const [newValue, setNewValue] = useState('');
  const [chart, setChart] = useState([false, null]);

  const submitHandler = async (event, pollId) => {
    if (!value) {
      event.preventDefault();
      return alert('Please select your answer');
    }

    try {
      const { data } = await axios.put('/api/poll', { pollId, value: value === 'Add option' ? newValue : value });
      setValue('');
      setNewValue('');
    } catch (error) {
      alert(error.response && error.response.data ? error.response.data.message : error.message);
    }
  };

  const chartHandler = (event) => {
    if (chart[0]) {
      setChart((chart) => [false, chart[1]]);
    } else if (!chart[0] && chart[1]) {
      setChart((chart) => [true, chart[1]]);
    } else {
      const getRandomColor = () => {
        var letters = '0123456789ABCDEF'.split('');
        var color = '#';
        for (var i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      };

      const ctx = event.target.nextElementSibling.firstElementChild;
      const pollChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: poll.options.map((option) => option.value),
          datasets: [
            {
              label: poll.question,
              data: poll.options.map((option) => option.total),
              backgroundColor: poll.options.map(() => getRandomColor()),
            },
          ],
        },
        options: {
          responsive: true,
          color: '#fff',
        },
      });

      setChart([true, pollChart]);
    }
  };

  return (
    <li key={poll._id}>
      <h2>{poll.question}</h2>
      <form onSubmit={(event) => submitHandler(event, poll._id)}>
        <select name="options" id="options" value={value} onChange={(event) => setValue(event.target.value)}>
          <option value="" disabled selected>
            Select your answer
          </option>
          {poll.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.value}
            </option>
          ))}
          <option value="Add option">Add option</option>
        </select>
        <input
          type="text"
          name="newValue"
          value={newValue}
          onChange={(event) => setNewValue(event.target.value)}
          placeholder="Enter your own answer"
          disabled={value !== 'Add option'}
          required
        />

        <button type="submit">Vote</button>
      </form>

      <button type="button" className="btn" onClick={chartHandler}>
        {chart[0] ? 'Hide Chart' : 'Show Chart'}
      </button>

      <div style={{ display: chart[0] ? 'block' : 'none' }} className="chart">
        <canvas></canvas>
      </div>

      <h3>Created by {poll.user.username}</h3>
    </li>
  );
}
