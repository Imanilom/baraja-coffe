class Activity {
  Activity({required this.id, required this.quote, required this.author});

  factory Activity.fromJson(Map<Object?, Object?> json) {
    return Activity(
      id: json['id'] as int,
      quote: json['quote'] as String,
      author: json['author'] as String,
    );
  }

  final int id;
  final String quote;
  final String author;
}
