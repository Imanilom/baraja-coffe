// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'event.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Event {

@HiveField(0)@JsonKey(name: '_id') String get id;@HiveField(1) String get name;@HiveField(2) String? get description;@HiveField(3) String? get location;@HiveField(4) DateTime? get date;@HiveField(5) int? get price;@HiveField(6) String? get organizer;@HiveField(7) String? get contactEmail;@HiveField(8) String? get imageUrl;@HiveField(9) String? get category;@HiveField(10) List<String>? get tags;@HiveField(11) String? get status;@HiveField(12) int? get capacity;@HiveField(13) List<String>? get attendees;@HiveField(14) String? get privacy;@HiveField(15) String? get terms;@HiveField(16) DateTime? get createdAt;@HiveField(17) DateTime? get updatedAt;
/// Create a copy of Event
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$EventCopyWith<Event> get copyWith => _$EventCopyWithImpl<Event>(this as Event, _$identity);

  /// Serializes this Event to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Event&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.description, description) || other.description == description)&&(identical(other.location, location) || other.location == location)&&(identical(other.date, date) || other.date == date)&&(identical(other.price, price) || other.price == price)&&(identical(other.organizer, organizer) || other.organizer == organizer)&&(identical(other.contactEmail, contactEmail) || other.contactEmail == contactEmail)&&(identical(other.imageUrl, imageUrl) || other.imageUrl == imageUrl)&&(identical(other.category, category) || other.category == category)&&const DeepCollectionEquality().equals(other.tags, tags)&&(identical(other.status, status) || other.status == status)&&(identical(other.capacity, capacity) || other.capacity == capacity)&&const DeepCollectionEquality().equals(other.attendees, attendees)&&(identical(other.privacy, privacy) || other.privacy == privacy)&&(identical(other.terms, terms) || other.terms == terms)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,description,location,date,price,organizer,contactEmail,imageUrl,category,const DeepCollectionEquality().hash(tags),status,capacity,const DeepCollectionEquality().hash(attendees),privacy,terms,createdAt,updatedAt);

@override
String toString() {
  return 'Event(id: $id, name: $name, description: $description, location: $location, date: $date, price: $price, organizer: $organizer, contactEmail: $contactEmail, imageUrl: $imageUrl, category: $category, tags: $tags, status: $status, capacity: $capacity, attendees: $attendees, privacy: $privacy, terms: $terms, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class $EventCopyWith<$Res>  {
  factory $EventCopyWith(Event value, $Res Function(Event) _then) = _$EventCopyWithImpl;
@useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String id,@HiveField(1) String name,@HiveField(2) String? description,@HiveField(3) String? location,@HiveField(4) DateTime? date,@HiveField(5) int? price,@HiveField(6) String? organizer,@HiveField(7) String? contactEmail,@HiveField(8) String? imageUrl,@HiveField(9) String? category,@HiveField(10) List<String>? tags,@HiveField(11) String? status,@HiveField(12) int? capacity,@HiveField(13) List<String>? attendees,@HiveField(14) String? privacy,@HiveField(15) String? terms,@HiveField(16) DateTime? createdAt,@HiveField(17) DateTime? updatedAt
});




}
/// @nodoc
class _$EventCopyWithImpl<$Res>
    implements $EventCopyWith<$Res> {
  _$EventCopyWithImpl(this._self, this._then);

  final Event _self;
  final $Res Function(Event) _then;

/// Create a copy of Event
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,Object? description = freezed,Object? location = freezed,Object? date = freezed,Object? price = freezed,Object? organizer = freezed,Object? contactEmail = freezed,Object? imageUrl = freezed,Object? category = freezed,Object? tags = freezed,Object? status = freezed,Object? capacity = freezed,Object? attendees = freezed,Object? privacy = freezed,Object? terms = freezed,Object? createdAt = freezed,Object? updatedAt = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,location: freezed == location ? _self.location : location // ignore: cast_nullable_to_non_nullable
as String?,date: freezed == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as DateTime?,price: freezed == price ? _self.price : price // ignore: cast_nullable_to_non_nullable
as int?,organizer: freezed == organizer ? _self.organizer : organizer // ignore: cast_nullable_to_non_nullable
as String?,contactEmail: freezed == contactEmail ? _self.contactEmail : contactEmail // ignore: cast_nullable_to_non_nullable
as String?,imageUrl: freezed == imageUrl ? _self.imageUrl : imageUrl // ignore: cast_nullable_to_non_nullable
as String?,category: freezed == category ? _self.category : category // ignore: cast_nullable_to_non_nullable
as String?,tags: freezed == tags ? _self.tags : tags // ignore: cast_nullable_to_non_nullable
as List<String>?,status: freezed == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String?,capacity: freezed == capacity ? _self.capacity : capacity // ignore: cast_nullable_to_non_nullable
as int?,attendees: freezed == attendees ? _self.attendees : attendees // ignore: cast_nullable_to_non_nullable
as List<String>?,privacy: freezed == privacy ? _self.privacy : privacy // ignore: cast_nullable_to_non_nullable
as String?,terms: freezed == terms ? _self.terms : terms // ignore: cast_nullable_to_non_nullable
as String?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [Event].
extension EventPatterns on Event {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Event value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Event() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Event value)  $default,){
final _that = this;
switch (_that) {
case _Event():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Event value)?  $default,){
final _that = this;
switch (_that) {
case _Event() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)@JsonKey(name: '_id')  String id, @HiveField(1)  String name, @HiveField(2)  String? description, @HiveField(3)  String? location, @HiveField(4)  DateTime? date, @HiveField(5)  int? price, @HiveField(6)  String? organizer, @HiveField(7)  String? contactEmail, @HiveField(8)  String? imageUrl, @HiveField(9)  String? category, @HiveField(10)  List<String>? tags, @HiveField(11)  String? status, @HiveField(12)  int? capacity, @HiveField(13)  List<String>? attendees, @HiveField(14)  String? privacy, @HiveField(15)  String? terms, @HiveField(16)  DateTime? createdAt, @HiveField(17)  DateTime? updatedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Event() when $default != null:
return $default(_that.id,_that.name,_that.description,_that.location,_that.date,_that.price,_that.organizer,_that.contactEmail,_that.imageUrl,_that.category,_that.tags,_that.status,_that.capacity,_that.attendees,_that.privacy,_that.terms,_that.createdAt,_that.updatedAt);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)@JsonKey(name: '_id')  String id, @HiveField(1)  String name, @HiveField(2)  String? description, @HiveField(3)  String? location, @HiveField(4)  DateTime? date, @HiveField(5)  int? price, @HiveField(6)  String? organizer, @HiveField(7)  String? contactEmail, @HiveField(8)  String? imageUrl, @HiveField(9)  String? category, @HiveField(10)  List<String>? tags, @HiveField(11)  String? status, @HiveField(12)  int? capacity, @HiveField(13)  List<String>? attendees, @HiveField(14)  String? privacy, @HiveField(15)  String? terms, @HiveField(16)  DateTime? createdAt, @HiveField(17)  DateTime? updatedAt)  $default,) {final _that = this;
switch (_that) {
case _Event():
return $default(_that.id,_that.name,_that.description,_that.location,_that.date,_that.price,_that.organizer,_that.contactEmail,_that.imageUrl,_that.category,_that.tags,_that.status,_that.capacity,_that.attendees,_that.privacy,_that.terms,_that.createdAt,_that.updatedAt);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)@JsonKey(name: '_id')  String id, @HiveField(1)  String name, @HiveField(2)  String? description, @HiveField(3)  String? location, @HiveField(4)  DateTime? date, @HiveField(5)  int? price, @HiveField(6)  String? organizer, @HiveField(7)  String? contactEmail, @HiveField(8)  String? imageUrl, @HiveField(9)  String? category, @HiveField(10)  List<String>? tags, @HiveField(11)  String? status, @HiveField(12)  int? capacity, @HiveField(13)  List<String>? attendees, @HiveField(14)  String? privacy, @HiveField(15)  String? terms, @HiveField(16)  DateTime? createdAt, @HiveField(17)  DateTime? updatedAt)?  $default,) {final _that = this;
switch (_that) {
case _Event() when $default != null:
return $default(_that.id,_that.name,_that.description,_that.location,_that.date,_that.price,_that.organizer,_that.contactEmail,_that.imageUrl,_that.category,_that.tags,_that.status,_that.capacity,_that.attendees,_that.privacy,_that.terms,_that.createdAt,_that.updatedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Event implements Event {
   _Event({@HiveField(0)@JsonKey(name: '_id') required this.id, @HiveField(1) required this.name, @HiveField(2) this.description = null, @HiveField(3) this.location = null, @HiveField(4) this.date = null, @HiveField(5) this.price = 0, @HiveField(6) this.organizer = null, @HiveField(7) this.contactEmail = null, @HiveField(8) this.imageUrl = null, @HiveField(9) this.category = null, @HiveField(10) final  List<String>? tags = const [], @HiveField(11) this.status = null, @HiveField(12) this.capacity = 1, @HiveField(13) final  List<String>? attendees = const [], @HiveField(14) this.privacy = null, @HiveField(15) this.terms = null, @HiveField(16) this.createdAt = null, @HiveField(17) this.updatedAt = null}): _tags = tags,_attendees = attendees;
  factory _Event.fromJson(Map<String, dynamic> json) => _$EventFromJson(json);

@override@HiveField(0)@JsonKey(name: '_id') final  String id;
@override@HiveField(1) final  String name;
@override@JsonKey()@HiveField(2) final  String? description;
@override@JsonKey()@HiveField(3) final  String? location;
@override@JsonKey()@HiveField(4) final  DateTime? date;
@override@JsonKey()@HiveField(5) final  int? price;
@override@JsonKey()@HiveField(6) final  String? organizer;
@override@JsonKey()@HiveField(7) final  String? contactEmail;
@override@JsonKey()@HiveField(8) final  String? imageUrl;
@override@JsonKey()@HiveField(9) final  String? category;
 final  List<String>? _tags;
@override@JsonKey()@HiveField(10) List<String>? get tags {
  final value = _tags;
  if (value == null) return null;
  if (_tags is EqualUnmodifiableListView) return _tags;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}

@override@JsonKey()@HiveField(11) final  String? status;
@override@JsonKey()@HiveField(12) final  int? capacity;
 final  List<String>? _attendees;
@override@JsonKey()@HiveField(13) List<String>? get attendees {
  final value = _attendees;
  if (value == null) return null;
  if (_attendees is EqualUnmodifiableListView) return _attendees;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}

@override@JsonKey()@HiveField(14) final  String? privacy;
@override@JsonKey()@HiveField(15) final  String? terms;
@override@JsonKey()@HiveField(16) final  DateTime? createdAt;
@override@JsonKey()@HiveField(17) final  DateTime? updatedAt;

/// Create a copy of Event
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$EventCopyWith<_Event> get copyWith => __$EventCopyWithImpl<_Event>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$EventToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Event&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.description, description) || other.description == description)&&(identical(other.location, location) || other.location == location)&&(identical(other.date, date) || other.date == date)&&(identical(other.price, price) || other.price == price)&&(identical(other.organizer, organizer) || other.organizer == organizer)&&(identical(other.contactEmail, contactEmail) || other.contactEmail == contactEmail)&&(identical(other.imageUrl, imageUrl) || other.imageUrl == imageUrl)&&(identical(other.category, category) || other.category == category)&&const DeepCollectionEquality().equals(other._tags, _tags)&&(identical(other.status, status) || other.status == status)&&(identical(other.capacity, capacity) || other.capacity == capacity)&&const DeepCollectionEquality().equals(other._attendees, _attendees)&&(identical(other.privacy, privacy) || other.privacy == privacy)&&(identical(other.terms, terms) || other.terms == terms)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,description,location,date,price,organizer,contactEmail,imageUrl,category,const DeepCollectionEquality().hash(_tags),status,capacity,const DeepCollectionEquality().hash(_attendees),privacy,terms,createdAt,updatedAt);

@override
String toString() {
  return 'Event(id: $id, name: $name, description: $description, location: $location, date: $date, price: $price, organizer: $organizer, contactEmail: $contactEmail, imageUrl: $imageUrl, category: $category, tags: $tags, status: $status, capacity: $capacity, attendees: $attendees, privacy: $privacy, terms: $terms, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class _$EventCopyWith<$Res> implements $EventCopyWith<$Res> {
  factory _$EventCopyWith(_Event value, $Res Function(_Event) _then) = __$EventCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String id,@HiveField(1) String name,@HiveField(2) String? description,@HiveField(3) String? location,@HiveField(4) DateTime? date,@HiveField(5) int? price,@HiveField(6) String? organizer,@HiveField(7) String? contactEmail,@HiveField(8) String? imageUrl,@HiveField(9) String? category,@HiveField(10) List<String>? tags,@HiveField(11) String? status,@HiveField(12) int? capacity,@HiveField(13) List<String>? attendees,@HiveField(14) String? privacy,@HiveField(15) String? terms,@HiveField(16) DateTime? createdAt,@HiveField(17) DateTime? updatedAt
});




}
/// @nodoc
class __$EventCopyWithImpl<$Res>
    implements _$EventCopyWith<$Res> {
  __$EventCopyWithImpl(this._self, this._then);

  final _Event _self;
  final $Res Function(_Event) _then;

/// Create a copy of Event
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,Object? description = freezed,Object? location = freezed,Object? date = freezed,Object? price = freezed,Object? organizer = freezed,Object? contactEmail = freezed,Object? imageUrl = freezed,Object? category = freezed,Object? tags = freezed,Object? status = freezed,Object? capacity = freezed,Object? attendees = freezed,Object? privacy = freezed,Object? terms = freezed,Object? createdAt = freezed,Object? updatedAt = freezed,}) {
  return _then(_Event(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,location: freezed == location ? _self.location : location // ignore: cast_nullable_to_non_nullable
as String?,date: freezed == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as DateTime?,price: freezed == price ? _self.price : price // ignore: cast_nullable_to_non_nullable
as int?,organizer: freezed == organizer ? _self.organizer : organizer // ignore: cast_nullable_to_non_nullable
as String?,contactEmail: freezed == contactEmail ? _self.contactEmail : contactEmail // ignore: cast_nullable_to_non_nullable
as String?,imageUrl: freezed == imageUrl ? _self.imageUrl : imageUrl // ignore: cast_nullable_to_non_nullable
as String?,category: freezed == category ? _self.category : category // ignore: cast_nullable_to_non_nullable
as String?,tags: freezed == tags ? _self._tags : tags // ignore: cast_nullable_to_non_nullable
as List<String>?,status: freezed == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String?,capacity: freezed == capacity ? _self.capacity : capacity // ignore: cast_nullable_to_non_nullable
as int?,attendees: freezed == attendees ? _self._attendees : attendees // ignore: cast_nullable_to_non_nullable
as List<String>?,privacy: freezed == privacy ? _self.privacy : privacy // ignore: cast_nullable_to_non_nullable
as String?,terms: freezed == terms ? _self.terms : terms // ignore: cast_nullable_to_non_nullable
as String?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}

// dart format on
