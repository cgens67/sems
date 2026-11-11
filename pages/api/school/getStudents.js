export default function handler(req, res) {
  const students = [
    {"id":"130815040173","name":"ALDAN KOH XIANG","class":"PB","gender":"L"},
    {"id":"130628040389","name":"ALVIN NG","class":"PB","gender":"L"},
    {"id":"130816040327","name":"CHIN MING ZHI","class":"PB","gender":"L"}
  ];

  res.status(200).json(students);
}