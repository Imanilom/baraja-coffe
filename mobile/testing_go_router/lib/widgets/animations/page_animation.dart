import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class RightToLeftTransitionPage extends StatelessWidget {
  const RightToLeftTransitionPage({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return CustomTransitionPage(
          child: child,
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            const begin = Offset(1.0, 0.0);
            const end = Offset.zero;
            const curve = Curves.ease;
            final tween = Tween(
              begin: begin,
              end: end,
            ).chain(CurveTween(curve: curve));
            return SlideTransition(
              position: animation.drive(tween),
              child: child,
            );
          },
        )
        as Widget;
  }
}
