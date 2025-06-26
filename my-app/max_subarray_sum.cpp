#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    
    int n;
    cin >> n;
    
    vector<int> a(n);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }
    
    // 使用 long long 来避免整数溢出
    long long max_so_far = a[0];
    long long max_ending_here = a[0];
    
    for (int i = 1; i < n; i++) {
        // 对于每个位置，要么将当前数字加入之前的子段，要么从当前数字开始新的子段
        max_ending_here = max((long long)a[i], max_ending_here + a[i]);
        // 更新全局最大和
        max_so_far = max(max_so_far, max_ending_here);
    }
    
    cout << max_so_far << endl;
    return 0;
} 