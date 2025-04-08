// import 'package:barajapos/routes/app_router.dart';
// import 'package:barajapos/screens/home/history_screen.dart';
// import 'package:barajapos/screens/home/saved_order_screen.dart';
// import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shadcn_flutter/shadcn_flutter.dart';

class Layout extends ConsumerWidget {
  const Layout({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Row(children: [
      Expanded(
          flex: 2,
          child: Scaffold(
            headers: [
              AppBar(
                backgroundColor: Colors.slate,
                title: const Text('Coffee'),
                leading: [
                  OutlineButton(
                    density: ButtonDensity.icon,
                    onPressed: () {},
                    child: const Icon(RadixIcons.codesandboxLogo),
                  ),
                ],
                trailing: [
                  //search input text
                  // TextField(
                  //   placeholder: AbsorbPointer(
                  //     child: Text('Search'),
                  //   ),
                  //   features: [
                  //     InputFeature.clear(),
                  //   ],
                  // ),
                  const NavigationItem(
                    child: Column(
                      children: [
                        Icon(RadixIcons.home),
                        SizedBox(width: 8),
                        Text('Home'),
                      ],
                    ),
                  ),
                  const NavigationItem(
                    child: Column(
                      children: [
                        Icon(LucideIcons.tabletSmartphone),
                        SizedBox(width: 8),
                        Text('Orders'),
                      ],
                    ),
                  ),
                  //history,
                  const NavigationItem(
                    child: Column(
                      children: [
                        Icon(LucideIcons.history),
                        SizedBox(width: 8),
                        Text('History'),
                      ],
                    ),
                  ),
                  //savedOrder,
                  NavigationItem(
                    onChanged: (index) {
                      if (index == 3) {
                        // ref.read(appRouter).push(SavedOrderScreen.route);
                      }
                    },
                    child: const Column(
                      children: [
                        Icon(LucideIcons.shoppingCart),
                        SizedBox(width: 8),
                        Text('Saved'),
                      ],
                    ),
                  ),
                ],
              ),
            ],
            child: Center(
              child: const Text('Headline 1').muted(),
            ),
          )),
      Expanded(
        flex: 1,
        child: Scaffold(
          headers: [
            AppBar(
              backgroundColor: Colors.sky,
              title: const Text('Detail Pesanan'),
              trailing: [
                OutlineButton(
                  density: ButtonDensity.icon,
                  onPressed: () {},
                  child: const Icon(RadixIcons.dotsVertical),
                ),
              ],
            ),
          ],
          child: Center(
            child: const Text('Headline 2').muted(),
          ),
        ),
      ),
    ]);
  }
}
