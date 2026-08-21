export function splitReportStudents<T>(students: readonly T[]): T[][] {
  if (students.length <= 12) return [students.slice()];

  const firstBatchSize = Math.ceil(students.length / 2);
  return [
    students.slice(0, firstBatchSize),
    students.slice(firstBatchSize),
  ];
}
